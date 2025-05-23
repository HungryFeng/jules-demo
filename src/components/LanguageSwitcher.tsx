import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (event: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    // Updated className for positioning
    <div className="absolute top-4 right-4 z-10"> 
      <select 
        value={i18n.language} 
        onChange={changeLanguage}
        // Added some basic styling for visibility and consistency.
        // Consider using classes from ui/select if a Shadcn select is preferred later.
        className="p-2 border rounded bg-background text-foreground shadow hover:bg-muted"
      >
        <option value="en">English</option>
        <option value="zh">中文</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
