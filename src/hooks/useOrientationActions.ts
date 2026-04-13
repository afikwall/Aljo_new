import { useExecuteAction } from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  RequestOrientationAction,
  type IRequestOrientationActionOutput,
  type IOrientationsEntity,
} from "@/product-types";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  findPendingOrientation,
  getPendingOrientationMessage,
} from "@/utils/orientationActionUtils";

interface UseOrientationActionsParams {
  staffOrientations: (IOrientationsEntity & { id: string })[] | undefined;
  refetchOrientations: () => void;
}

interface OrientationRequestResult {
  success: boolean;
  alreadyRequested: boolean;
  message?: string;
}

export function useOrientationActions({
  staffOrientations,
  refetchOrientations,
}: UseOrientationActionsParams) {
  const { executeFunction } = useExecuteAction(RequestOrientationAction);
  const [isRequesting, setIsRequesting] = useState(false);

  const requestOrientation = useCallback(
    async (
      staffProfileId: string,
      facilityId: string,
      staffEmail: string,
    ): Promise<OrientationRequestResult> => {
      // Check for existing pending orientation before making the request
      const existingPending = findPendingOrientation(
        staffOrientations || [],
        facilityId,
      );

      if (existingPending) {
        const message = getPendingOrientationMessage(existingPending);
        toast.info(message);
        return { success: false, alreadyRequested: true, message };
      }

      setIsRequesting(true);
      try {
        const result: IRequestOrientationActionOutput = await executeFunction({
          staffProfileId,
          facilityId,
          staffEmail,
        });

        if (result.alreadyRequested) {
          toast.info(
            result.message ||
              "You already have a pending orientation request at this facility.",
          );
        } else if (result.success) {
          toast.success(
            result.message ||
              "Orientation requested! The facility manager will review your request.",
          );
        } else {
          toast.error(result.message || "Failed to request orientation.");
        }

        refetchOrientations();

        return {
          success: result.success,
          alreadyRequested: result.alreadyRequested,
          message: result.message,
        };
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to request orientation. Please try again.";
        toast.error(message);
        return { success: false, alreadyRequested: false, message };
      } finally {
        setIsRequesting(false);
      }
    },
    [executeFunction, staffOrientations, refetchOrientations],
  );

  return {
    requestOrientation,
    isRequesting,
  };
}