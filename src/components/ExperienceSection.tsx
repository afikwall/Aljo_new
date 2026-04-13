import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, X, Trash2, Stethoscope } from "lucide-react";
import type { IStaffProfilesEntity } from "@/product-types";
import {
  PreviousEmployersSection,
  type EmployerItem,
} from "@/components/PreviousEmployersSection";
import { ALJOActivityStats } from "@/components/ALJOActivityStats";

interface ReferenceItem {
  name: string;
  phone: string;
  relationship: string;
}

interface ExperienceSectionProps {
  formData: Partial<IStaffProfilesEntity>;
  languages: string[];
  specialSkills: string[];
  references: ReferenceItem[];
  isEditMode: boolean;
  onChange: (data: Partial<IStaffProfilesEntity>) => void;
  onLanguagesChange: (langs: string[]) => void;
  onSkillsChange: (skills: string[]) => void;
  onReferencesChange: (refs: ReferenceItem[]) => void;
  employers?: EmployerItem[];
  onEmployersChange?: (employers: EmployerItem[]) => void;
  staffProfileId?: string;
}

export const ExperienceSection = ({
  formData,
  languages,
  specialSkills,
  references,
  isEditMode,
  onChange,
  onLanguagesChange,
  onSkillsChange,
  onReferencesChange,
  employers = [],
  onEmployersChange,
  staffProfileId,
}: ExperienceSectionProps) => {
  const [langInput, setLangInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [newRef, setNewRef] = useState<ReferenceItem>({
    name: "",
    phone: "",
    relationship: "",
  });

  const addLanguage = useCallback(() => {
    const trimmed = langInput.trim();
    if (trimmed && !languages.includes(trimmed)) {
      onLanguagesChange([...languages, trimmed]);
      setLangInput("");
    }
  }, [langInput, languages, onLanguagesChange]);

  const removeLanguage = useCallback(
    (lang: string) => {
      onLanguagesChange(languages.filter((l) => l !== lang));
    },
    [languages, onLanguagesChange]
  );

  const addSkill = useCallback(() => {
    const trimmed = skillInput.trim();
    if (trimmed && !specialSkills.includes(trimmed)) {
      onSkillsChange([...specialSkills, trimmed]);
      setSkillInput("");
    }
  }, [skillInput, specialSkills, onSkillsChange]);

  const removeSkill = useCallback(
    (skill: string) => {
      onSkillsChange(specialSkills.filter((s) => s !== skill));
    },
    [specialSkills, onSkillsChange]
  );

  const addReference = useCallback(() => {
    if (newRef.name && newRef.phone && newRef.relationship) {
      onReferencesChange([...references, { ...newRef }]);
      setNewRef({ name: "", phone: "", relationship: "" });
    }
  }, [newRef, references, onReferencesChange]);

  const removeReference = useCallback(
    (index: number) => {
      onReferencesChange(references.filter((_, i) => i !== index));
    },
    [references, onReferencesChange]
  );

  const handleEmployersChange = useCallback(
    (newEmployers: EmployerItem[]) => {
      onEmployersChange?.(newEmployers);
    },
    [onEmployersChange]
  );

  return (
    <div className="space-y-6">
      {/* Manual Experience Sub-section */}
      <div className="space-y-4">
        {isEditMode && (
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Manual Experience
          </h4>
        )}

        {/* Total Healthcare Years */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Total Years in Healthcare</p>
          </div>
          {isEditMode ? (
            <Input
              type="number"
              min={0}
              value={formData.totalHealthcareYears ?? formData.yearsOfExperience ?? ""}
              onChange={(e) =>
                onChange({
                  totalHealthcareYears: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                  yearsOfExperience: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              placeholder="0"
              className="h-10 text-base sm:text-sm max-w-[200px]"
            />
          ) : (formData.totalHealthcareYears ?? formData.yearsOfExperience) != null ? (
            <p className="text-sm text-muted-foreground">
              {formData.totalHealthcareYears ?? formData.yearsOfExperience} year
              {(formData.totalHealthcareYears ?? formData.yearsOfExperience ?? 0) !== 1 ? "s" : ""}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Not set</p>
          )}
        </div>

        {/* Special Skills Tag Input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Special Skills</Label>
          {isEditMode ? (
            <>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Type a skill and press Enter"
                  className="h-10 text-base sm:text-sm"
                />
                <Button
                  type="button"
                  onClick={addSkill}
                  size="sm"
                  className="h-10"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {specialSkills.map((skill) => (
                  <Badge
                    key={skill}
                    className="rounded-full bg-secondary text-secondary-foreground gap-1"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </>
          ) : specialSkills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {specialSkills.map((skill) => (
                <Badge
                  key={skill}
                  className="rounded-full bg-secondary text-secondary-foreground"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Not set</p>
          )}
        </div>

        {/* Languages Tag Input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Languages</Label>
          {isEditMode ? (
            <>
              <div className="flex gap-2">
                <Input
                  value={langInput}
                  onChange={(e) => setLangInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLanguage();
                    }
                  }}
                  placeholder="Type a language and press Enter"
                  className="h-10 text-base sm:text-sm"
                />
                <Button
                  type="button"
                  onClick={addLanguage}
                  size="sm"
                  className="h-10"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <Badge
                    key={lang}
                    className="rounded-full bg-secondary text-secondary-foreground gap-1"
                  >
                    {lang}
                    <button
                      type="button"
                      onClick={() => removeLanguage(lang)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </>
          ) : languages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <Badge
                  key={lang}
                  className="rounded-full bg-secondary text-secondary-foreground"
                >
                  {lang}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Not set</p>
          )}
        </div>

        {/* Previous Employers */}
        {onEmployersChange && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Previous Employers</Label>
            <PreviousEmployersSection
              employers={employers}
              isEditMode={isEditMode}
              onEmployersChange={handleEmployersChange}
            />
          </div>
        )}

        {/* Professional References */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Professional References</Label>
          {!isEditMode ? (
            references.length > 0 ? (
              <div className="space-y-2">
                {references.map((ref, i) => (
                  <div
                    key={i}
                    className="p-3 border rounded-lg space-y-1 bg-background"
                  >
                    <p className="font-semibold text-sm">{ref.name}</p>
                    <p className="text-sm text-muted-foreground">{ref.phone}</p>
                    <Badge variant="outline" className="text-xs">
                      {ref.relationship}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No references added
              </p>
            )
          ) : (
            <>
              {references.map((ref, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg space-y-1 relative bg-background"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeReference(index)}
                    className="absolute top-2 right-2 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <p className="font-semibold text-sm">{ref.name}</p>
                  <p className="text-sm text-muted-foreground">{ref.phone}</p>
                  <Badge variant="outline" className="text-xs">
                    {ref.relationship}
                  </Badge>
                </div>
              ))}

              <div className="space-y-2 p-3 border rounded-lg bg-background">
                <p className="text-sm font-medium">Add Reference</p>
                <Input
                  value={newRef.name}
                  onChange={(e) =>
                    setNewRef({ ...newRef, name: e.target.value })
                  }
                  placeholder="Name"
                  className="h-10 text-base sm:text-sm"
                />
                <Input
                  value={newRef.phone}
                  onChange={(e) =>
                    setNewRef({ ...newRef, phone: e.target.value })
                  }
                  placeholder="Phone"
                  className="h-10 text-base sm:text-sm"
                />
                <Input
                  value={newRef.relationship}
                  onChange={(e) =>
                    setNewRef({ ...newRef, relationship: e.target.value })
                  }
                  placeholder="Relationship (e.g., Former Supervisor)"
                  className="h-10 text-base sm:text-sm"
                />
                <Button
                  type="button"
                  onClick={addReference}
                  size="sm"
                  className="w-full h-10"
                  disabled={
                    !newRef.name || !newRef.phone || !newRef.relationship
                  }
                >
                  Add Reference
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ALJO Activity History Sub-section - only in view mode */}
      {!isEditMode && staffProfileId && (
        <>
          <Separator />
          <ALJOActivityStats staffProfileId={staffProfileId} />
        </>
      )}
    </div>
  );
};