'use client';

import type { TemplateMeta, TrainingGoal } from '@onemore/shared';
import { useTranslations } from 'next-intl';

import { GymPickerField } from '@/components/gym-ui/gym-picker-field';
import { ThemedTextInput } from '@/components/themed-text-input';

const OBJECTIVES: TrainingGoal[] = ['mass', 'strength', 'fat_loss', 'recomp', 'fitness'];

interface AdminTemplateMetaFormProps {
  meta: TemplateMeta;
  objective: TrainingGoal;
  onMetaChange: (meta: TemplateMeta) => void;
  onObjectiveChange: (objective: TrainingGoal) => void;
}

/**
 * Catalog template metadata fields for the admin console.
 */
export function AdminTemplateMetaForm({
  meta,
  objective,
  onMetaChange,
  onObjectiveChange,
}: AdminTemplateMetaFormProps): React.ReactElement {
  const t = useTranslations('Admin');

  const objectiveOptions = OBJECTIVES.map((value) => ({
    value,
    label: t(`objective.${value}`),
  }));

  return (
    <div className="grid max-w-2xl gap-4 md:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm">
        {t('displayNameEn')}
        <ThemedTextInput
          value={meta.displayName.en}
          onChange={(e) => {
            onMetaChange({
              ...meta,
              displayName: { ...meta.displayName, en: e.target.value },
            });
          }}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t('displayNameIt')}
        <ThemedTextInput
          value={meta.displayName.it ?? ''}
          onChange={(e) => {
            onMetaChange({
              ...meta,
              displayName: { ...meta.displayName, it: e.target.value },
            });
          }}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t('audience')}
        <ThemedTextInput
          value={meta.audience}
          onChange={(e) => {
            onMetaChange({ ...meta, audience: e.target.value });
          }}
        />
      </label>
      <GymPickerField
        label={t('objectiveLabel')}
        options={objectiveOptions}
        value={objective}
        onChange={(value) => {
          onObjectiveChange(value as TrainingGoal);
        }}
      />
      <label className="flex flex-col gap-1 text-sm md:col-span-2">
        {t('guideEn')}
        <ThemedTextInput
          value={meta.guide.en}
          onChange={(e) => {
            onMetaChange({
              ...meta,
              guide: { ...meta.guide, en: e.target.value },
            });
          }}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm md:col-span-2">
        {t('guideIt')}
        <ThemedTextInput
          value={meta.guide.it ?? ''}
          onChange={(e) => {
            onMetaChange({
              ...meta,
              guide: { ...meta.guide, it: e.target.value },
            });
          }}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm md:col-span-2">
        {t('taglineEn')}
        <ThemedTextInput
          value={meta.tagline?.en ?? ''}
          onChange={(e) => {
            onMetaChange({
              ...meta,
              tagline: { en: e.target.value, it: meta.tagline?.it },
            });
          }}
        />
      </label>
    </div>
  );
}
