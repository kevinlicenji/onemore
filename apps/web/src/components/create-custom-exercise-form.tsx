'use client';

import type { CreateCustomExercise, MuscleGroup } from '@onemore/shared';
import { EQUIPMENT_TYPES, MUSCLE_GROUPS } from '@onemore/shared';
import { Button, Input } from '@onemore/ui';

import { GymPickerField } from '@/components/gym-ui/gym-picker-field';
import { useIsDesktop } from '@/hooks/use-is-desktop';

interface CreateCustomExerciseFormProps {
  form: CreateCustomExercise;
  labels: {
    nameEn: string;
    nameIt: string;
    primaryMuscle: string;
    equipmentField: string;
    saveCustom: string;
    cancelCustom: string;
  };
  loading: boolean;
  labelEquipment: (value: string) => string;
  translateMuscle: (key: MuscleGroup) => string;
  onChange: (next: CreateCustomExercise) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

/**
 * Shared form fields for creating a custom exercise (sheet or dialog).
 */
export function CreateCustomExerciseForm({
  form,
  labels,
  loading,
  labelEquipment,
  translateMuscle,
  onChange,
  onCancel,
  onSubmit,
}: CreateCustomExerciseFormProps): React.ReactElement {
  const isDesktop = useIsDesktop();

  const muscleOptions = MUSCLE_GROUPS.map((value) => ({
    value,
    label: translateMuscle(value),
  }));

  const equipmentOptions = EQUIPMENT_TYPES.map((value) => ({
    value,
    label: labelEquipment(value),
  }));

  const muscleField = isDesktop ? (
    <label className="flex flex-col gap-1 text-sm">
      {labels.primaryMuscle}
      <select
        className="min-h-12 rounded-md border bg-background px-2 text-sm text-foreground"
        value={form.primaryMuscles[0] ?? 'chest'}
        onChange={(e) => {
          const nextMuscle = e.target.value as MuscleGroup;
          onChange({ ...form, primaryMuscles: [nextMuscle] });
        }}
      >
        {muscleOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ) : (
    <GymPickerField
      label={labels.primaryMuscle}
      options={muscleOptions}
      value={form.primaryMuscles[0] ?? 'chest'}
      onChange={(value) => {
        onChange({ ...form, primaryMuscles: [value as MuscleGroup] });
      }}
    />
  );

  const equipmentField = isDesktop ? (
    <label className="flex flex-col gap-1 text-sm">
      {labels.equipmentField}
      <select
        className="min-h-12 rounded-md border bg-background px-2 text-sm text-foreground"
        value={form.equipment}
        onChange={(e) => {
          onChange({ ...form, equipment: e.target.value });
        }}
      >
        {equipmentOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ) : (
    <GymPickerField
      label={labels.equipmentField}
      options={equipmentOptions}
      value={form.equipment}
      onChange={(value) => {
        onChange({ ...form, equipment: value });
      }}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        {labels.nameEn}
        <Input
          className="min-h-12"
          value={form.names.en}
          onChange={(e) => {
            onChange({ ...form, names: { ...form.names, en: e.target.value } });
          }}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {labels.nameIt}
        <Input
          className="min-h-12"
          value={form.names.it ?? ''}
          onChange={(e) => {
            onChange({ ...form, names: { ...form.names, it: e.target.value } });
          }}
        />
      </label>
      {muscleField}
      {equipmentField}
      <div className="mt-1 flex gap-2">
        <Button className="min-h-12 flex-1" type="button" variant="outline" onClick={onCancel}>
          {labels.cancelCustom}
        </Button>
        <Button
          className="min-h-12 flex-1"
          disabled={loading || form.names.en.trim().length === 0}
          type="button"
          onClick={onSubmit}
        >
          {labels.saveCustom}
        </Button>
      </div>
    </div>
  );
}
