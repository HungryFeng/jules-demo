import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ThemeToggle } from '@/components/theme-toggle'; // Import ThemeToggle
import { TodoItem } from './types';
import LanguageSwitcher from './components/LanguageSwitcher'; // Import LanguageSwitcher
import './App.css';

function App() {
  const { t } = useTranslation(); // Initialize useTranslation
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoText, setNewTodoText] = useState<string>('');

  // Load todos from localStorage on initial render
  useEffect(() => {
    const storedTodos = localStorage.getItem('todos');
    if (storedTodos) {
      try {
        const parsedTodos = JSON.parse(storedTodos);
        if (Array.isArray(parsedTodos)) { // Basic validation
          setTodos(parsedTodos);
        }
      } catch (error) {
        console.error("Failed to parse todos from localStorage", error);
        setTodos([]); // Default to empty array on error
      }
    }
  }, []); // Empty dependency array means this effect runs once on mount

  // Save todos to localStorage whenever they change
  useEffect(() => {
    // Avoid saving the initial empty array before they've had a chance to load
    // or if todos were cleared (e.g. by parsing error).
    // The initial load effect will set the state, and then this effect will run.
    // If 'todos' is an empty array after loading (or due to error), it's correct to save it as such.
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]); // This effect runs whenever the 'todos' state changes

  const handleAddTodo = () => {
    const trimmedText = newTodoText.trim();
    if (trimmedText) {
      setTodos([
        ...todos,
        {
          id: Date.now().toString(),
          text: trimmedText,
          completed: false,
        },
      ]);
      setNewTodoText('');
    }
  };

  const handleToggleComplete = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <div className="container mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
      {/* This is the new wrapper div */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      {/* Translate heading */}
      <h1 className="text-3xl font-bold text-center my-8">{t('todoList')}</h1>
      <div className="flex gap-2 mb-6">
        <Input
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          // Translate placeholder
          placeholder={t('whatNeedsToBeDone')}
          className="flex-grow"
        />
        {/* Translate button text */}
        <Button onClick={handleAddTodo}>{t('addTodo')}</Button>
      </div>
      <div className="space-y-2">
        {todos.length === 0 ? (
          // Translate "No todos yet!" message
          <p className="text-muted-foreground text-center py-4">{t('noTodosYet')}</p>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 p-3 rounded-md border bg-card"
            >
              <Checkbox
                id={`todo-${todo.id}`}
                checked={todo.completed}
                onCheckedChange={() => handleToggleComplete(todo.id)}
              />
              <label
                htmlFor={`todo-${todo.id}`}
                className={`flex-grow ${todo.completed ? 'line-through text-muted-foreground' : ''}`}
              >
                {todo.text}
              </label>
              {/* Translate button text */}
              <Button variant="destructive" size="sm" onClick={() => handleDeleteTodo(todo.id)}>
                {t('delete')}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
