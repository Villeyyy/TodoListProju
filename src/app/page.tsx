'use client';
import React, { useEffect, useState } from 'react';
import styles from './page.module.css';

type Todo = {
  id: string;
  text: string;
  done?: boolean;
};

type Category = {
  id: string;
  name: string;
  items: string[];
  emoji?: string;
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Kauppa', items: ['Maito', 'Leipä', 'Juusto'], emoji: '🛒' },
  { id: 'c2', name: 'Siivous', items: ['Imurointi', 'Pyykit', 'Ikkunat'], emoji: '🧹' },
  { id: 'c3', name: 'Työt', items: ['Sähköpostit', 'Kokousmuistiot', 'Raportti'], emoji: '💼' },
];

export default function Page() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // categories (persisted to localStorage)
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const raw = localStorage.getItem('mytodo:categories');
      return raw ? (JSON.parse(raw) as Category[]) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories.length > 0 ? categories[0].id : null
  );
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newPresetItem, setNewPresetItem] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await fetchTodos(mounted);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('mytodo:categories', JSON.stringify(categories));
      if (!selectedCategoryId && categories.length) setSelectedCategoryId(categories[0].id);
    } catch {
      /* ignore */
    }
  }, [categories, selectedCategoryId]);

  async function fetchTodos(mounted = true) {
    try {
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      if (mounted) setTodos(data.todos || []);
    } catch {
      if (mounted) setError('Ei saatu tehtäviä palvelimelta — yritä uudelleen');
    }
  }

  async function addTodo(e?: React.FormEvent, textArg?: string) {
    e?.preventDefault();
    const text = (textArg ?? newTodo).trim();
    if (!text) return;
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('Add failed');
      const data = await res.json();
      setTodos(data.todos);
      if (!textArg) setNewTodo('');
    } catch {
      setError('Lisäys epäonnistui');
    }
  }

  async function deleteTodo(id: string) {
    try {
      const res = await fetch('/api/todos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      const data = await res.json();
      setTodos(data.todos);
    } catch {
      setError('Poisto epäonnistui');
    }
  }

  function toggleDone(id: string) {
    setTodos((prev) => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  // Category functions
  function selectCategory(id: string) {
    setSelectedCategoryId(id);
  }

  function addCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    const cat: Category = { id: String(Date.now()), name, items: [], emoji: '📁' };
    setCategories(prev => [cat, ...prev]);
    setNewCategoryName('');
    setSelectedCategoryId(cat.id);
  }

  function addPresetToCategory(categoryId: string) {
    const item = newPresetItem.trim();
    if (!item) return;
    setCategories(prev =>
      prev.map(c => c.id === categoryId ? { ...c, items: [...c.items, item] } : c)
    );
    setNewPresetItem('');
  }

  function deleteCategory(id: string) {
    if (!confirm('Haluatko varmasti poistaa kategorian? Tämä poistaa myös ehdotukset.')) return;
    setCategories(prev => {
      const next = prev.filter(c => c.id !== id);
      if (selectedCategoryId === id) {
        setSelectedCategoryId(next.length ? next[0].id : null);
      }
      return next;
    });
  }

  async function addAllFromCategory(categoryId: string) {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat || cat.items.length === 0) return;
    setLoading(true);
    try {
      for (const it of cat.items) {
        await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: it }),
        });
      }
      await fetchTodos();
    } catch {
      setError('Lisäys epäonnistui');
    } finally {
      setLoading(false);
    }
  }

  function removePreset(categoryId: string, idx: number) {
    setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, items: c.items.filter((_, i) => i !== idx) } : c));
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>📝 Moderni TODO</h1>

        <div className={styles.grid}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <strong>Kategoriat</strong>
            </div>

            <ul className={styles.categoryList}>
              {categories.map(c => (
                <li
                  key={c.id}
                  className={`${styles.categoryItem} ${c.id === selectedCategoryId ? styles.activeCategory : ''}`}
                  onClick={() => selectCategory(c.id)}
                >
                  <div className={styles.catMain}>
                    <span className={styles.catEmoji}>{c.emoji ?? '📂'}</span>
                    <span className={styles.catName}>{c.name}</span>
                    <span className={styles.catCount}>{c.items.length}</span>
                  </div>
                  <button
                    className={styles.catDelete}
                    onClick={(e) => { e.stopPropagation(); deleteCategory(c.id); }}
                    aria-label={`Poista kategoria ${c.name}`}
                    title="Poista kategoria"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <div className={styles.addCategory}>
              <input
                className={styles.inputSmall}
                placeholder="Uusi kategoria..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addCategory(); }}
              />
              <button className={styles.smallBtn} onClick={addCategory}>Lisää</button>
            </div>
          </aside>

          <section className={styles.content}>
            <form className={styles.form} onSubmit={(e) => addTodo(e)}>
              <input
                className={styles.input}
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Lisää uusi tehtävä..."
                aria-label="uusi tehtävä"
              />
              <button className={styles.primary} type="submit">Lisää</button>
            </form>

            {selectedCategoryId && (
              <div className={styles.presets}>
                <div className={styles.presetsHeader}>
                  <strong>Ehdotukset</strong>
                  <button className={styles.ghost} onClick={() => addAllFromCategory(selectedCategoryId)}>Lisää kaikki</button>
                </div>

                <div className={styles.chips}>
                  {(categories.find(c => c.id === selectedCategoryId)?.items ?? []).map((it, i) => (
                    <div className={styles.chip} key={i}>
                      <button className={styles.chipAdd} onClick={() => addTodo(undefined, it)}>＋</button>
                      <span className={styles.chipText}>{it}</span>
                      <button className={styles.chipRemove} onClick={() => removePreset(selectedCategoryId, i)}>×</button>
                    </div>
                  ))}
                  { (categories.find(c => c.id === selectedCategoryId)?.items ?? []).length === 0 && (
                    <div className={styles.emptyPreset}>Ei ehdotuksia — lisää oma</div>
                  )}
                </div>

                <div className={styles.addPresetRow}>
                  <input
                    className={styles.inputSmall}
                    placeholder="Lisää ehdotus tähän kategoriaan..."
                    value={newPresetItem}
                    onChange={(e) => setNewPresetItem(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && selectedCategoryId) { e.preventDefault(); addPresetToCategory(selectedCategoryId); } }}
                  />
                  <button className={styles.smallBtn} onClick={() => selectedCategoryId && addPresetToCategory(selectedCategoryId)}>Lisää ehdotus</button>
                </div>
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}
            {loading ? (
              <div className={styles.loading}>Ladataan…</div>
            ) : (
              <ul className={styles.list}>
                {todos.length === 0 && <li className={styles.empty}>Ei tehtäviä — lisää uusi!</li>}
                {todos.map((t) => (
                  <li key={t.id} className={`${styles.item} ${t.done ? styles.done : ''}`}>
                    <label className={styles.itemContent}>
                      <input
                        type="checkbox"
                        checked={!!t.done}
                        onChange={() => toggleDone(t.id)}
                        aria-label={`merkitse ${t.text}`}
                      />
                      <span className={styles.text}>{t.text}</span>
                    </label>
                    <button
                      className={styles.delete}
                      onClick={() => deleteTodo(t.id)}
                      aria-label={`poista ${t.text}`}
                    >
                      Poista
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}