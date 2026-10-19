import { useTranslation } from 'react-i18next';
import { LANGS } from '../i18n';
import { SimpleSelect } from './simple-select';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const value = i18n.resolvedLanguage === 'th' ? 'th' : 'en';
  return (
    <SimpleSelect
      items={LANGS}
      value={value}
      onChange={(l) => void i18n.changeLanguage(l)}
      label={t('language.label')}
      hideLabel
      size="sm"
      width="28"
    />
  );
}
