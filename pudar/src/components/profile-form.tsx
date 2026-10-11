import DateTimePicker from '@react-native-community/datetimepicker';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { localDateToDate, todayLocal, toLocalDate } from '@/lib/date';
import { LOCALE } from '@/lib/locale';
import {
  MAX_PROFILE_NAME_LENGTH,
  characterCount,
  hasErrors,
  validateProfileInput,
  type ProfileInput,
} from '@/lib/profile';
import { PROFILE_COLORS, PROFILE_ICONS } from '@/theme/profile-style';
import { colors, radii, spacing } from '@/theme/tokens';
import { fonts, typography } from '@/theme/typography';

import { AppText } from './app-text';
import { Icon } from './icon';
import { PrimaryButton } from './primary-button';
import { ProfileAvatar } from './profile-avatar';

export function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
  children,
}: {
  initial: ProfileInput;
  submitLabel: string;
  onSubmit: (input: ProfileInput) => Promise<void>;
  /** Extra actions under the form (edit screen: start again, delete). */
  children?: ReactNode;
}) {
  const [input, setInput] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  const today = todayLocal();
  const errors = validateProfileInput(input, today);
  const set = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) =>
    setInput((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    setSubmitted(true);
    if (hasErrors(errors)) {
      return;
    }
    setSaving(true);
    try {
      await onSubmit(input);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.preview}>
        <ProfileAvatar
          name={input.name || '?'}
          icon={input.icon}
          accentColor={input.accentColor}
          size={72}
        />
      </View>

      <Field
        label="Nama atau panggilan"
        error={submitted ? errors.name : undefined}
        hint={`${characterCount(input.name.trim())} / ${MAX_PROFILE_NAME_LENGTH}`}>
        <TextInput
          value={input.name}
          onChangeText={(name) => set('name', name)}
          placeholder="Ruang ini untuk siapa?"
          placeholderTextColor={colors.mutedInk}
          accessibilityLabel="Nama atau panggilan"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          style={styles.input}
        />
      </Field>

      <Field label="Ikon (opsional)">
        <View style={styles.choices}>
          {PROFILE_ICONS.map((icon) => {
            const selected = input.icon === icon.key;
            return (
              <Choice
                key={icon.key}
                label={icon.label}
                selected={selected}
                onPress={() => set('icon', selected ? null : icon.key)}>
                <Icon icon={icon.icon} size={20} color={colors.text} />
              </Choice>
            );
          })}
        </View>
      </Field>

      <Field label="Warna (opsional)">
        <View style={styles.choices}>
          {PROFILE_COLORS.map((color) => {
            const selected = input.accentColor === color.hex;
            return (
              <Choice
                key={color.hex}
                label={color.label}
                selected={selected}
                fill={color.hex}
                onPress={() => set('accentColor', selected ? null : color.hex)}
              />
            );
          })}
        </View>
      </Field>

      <Field
        label="Hari pertama tanpa kontak (opsional)"
        error={submitted ? errors.noContactStartDate : undefined}>
        {input.noContactStartDate === null ? (
          <TextButton label="Atur hari kamu memulai" onPress={() => {
            set('noContactStartDate', today);
            if (Platform.OS !== 'ios') setShowAndroidPicker(true);
          }} />
        ) : (
          <View style={styles.dateRow}>
            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={localDateToDate(input.noContactStartDate)}
                mode="date"
                display="compact"
                locale={LOCALE}
                maximumDate={localDateToDate(today)}
                accentColor={colors.primaryInk}
                onChange={(_, date) => date && set('noContactStartDate', toLocalDate(date))}
              />
            ) : (
              <>
                <TextButton
                  label={localDateToDate(input.noContactStartDate).toLocaleDateString(LOCALE, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  onPress={() => setShowAndroidPicker(true)}
                />
                {showAndroidPicker && (
                  <DateTimePicker
                    value={localDateToDate(input.noContactStartDate)}
                    mode="date"
                    maximumDate={localDateToDate(today)}
                    onChange={(_, date) => {
                      setShowAndroidPicker(false);
                      if (date) set('noContactStartDate', toLocalDate(date));
                    }}
                  />
                )}
              </>
            )}
            <TextButton label="Hapus" onPress={() => set('noContactStartDate', null)} />
          </View>
        )}
      </Field>

      <PrimaryButton label={submitLabel} onPress={submit} disabled={saving} />
      {children}
    </View>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <AppText variant="label">{label}</AppText>
        {hint && <AppText variant="caption">{hint}</AppText>}
      </View>
      {children}
      {error && (
        <AppText variant="caption" style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      )}
    </View>
  );
}

function Choice({
  label,
  selected,
  fill,
  onPress,
  children,
}: {
  label: string;
  selected: boolean;
  fill?: string;
  onPress: () => void;
  children?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={4}
      style={[
        styles.choice,
        { backgroundColor: fill ?? colors.neutralBg },
        selected && styles.choiceSelected,
      ]}>
      {children}
    </Pressable>
  );
}

export function TextButton({
  label,
  onPress,
  destructive = false,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={styles.textButton}>
      <AppText style={[styles.textButtonLabel, destructive && styles.destructive]}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  preview: {
    alignItems: 'center',
  },
  field: {
    gap: spacing.sm,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 4,
  },
  choice: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  choiceSelected: {
    borderColor: colors.text,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textButton: {
    paddingVertical: spacing.xs,
  },
  textButtonLabel: {
    fontFamily: fonts.sansSemiBold,
    color: colors.primaryInk,
  },
  destructive: {
    color: colors.dangerInk,
  },
  error: {
    color: colors.dangerInk,
  },
});
