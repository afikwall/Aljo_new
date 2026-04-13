import { useExecuteAction } from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  GeneratePayrollAction,
  type IGeneratePayrollActionInput,
  type IGeneratePayrollActionOutput,
} from "@/product-types";
import { useCallback } from "react";

type GeneratePayrollResult = IGeneratePayrollActionOutput & {
  error?: string;
};

export function useGeneratePayroll() {
  const { executeFunction, isLoading } = useExecuteAction(GeneratePayrollAction);

  const wrappedExecuteFunction = useCallback(
    async (input: IGeneratePayrollActionInput): Promise<GeneratePayrollResult> => {
      try {
        const result = await executeFunction(input);
        return result as GeneratePayrollResult;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to generate payroll";
        return {
          error: message,
          timesheetsCreated: 0,
          totalGrossPay: 0,
          totalEarlyPayDeducted: 0,
          earlyPayRequestsMarkedPaid: 0,
        };
      }
    },
    [executeFunction],
  );

  return {
    executeFunction: wrappedExecuteFunction,
    isLoading,
  };
}