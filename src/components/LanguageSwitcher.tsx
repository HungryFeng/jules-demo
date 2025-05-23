import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex gap-2 justify-center my-4">
      <Button 
        variant={i18n.language === 'en' ? 'default' : 'outline'} 
        onClick={() => changeLanguage('en')}
      >
        English
      </Button>
      <Button 
        variant={i18n.language === 'zh' ? 'default' : 'outline'} 
        onClick={() => changeLanguage('zh')}
      >
        中文
      </Button>
    </div>
  );
};

export default LanguageSwitcher;
