import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Button from './Button.jsx';

function createSection() {
  return {
    id: `section-${Date.now()}`,
    title: 'New Resume Section',
    content: '',
  };
}

export default function ResumeSectionBuilder({ sections, onChange }) {
  const [removingIds, setRemovingIds] = useState([]);

  function updateSection(id, patch) {
    onChange(sections.map((section) => (section.id === id ? { ...section, ...patch } : section)));
  }

  function addSection() {
    onChange([...sections, createSection()]);
  }

  function removeSection(id) {
    setRemovingIds((current) => [...current, id]);
    window.setTimeout(() => {
      onChange(sections.filter((section) => section.id !== id));
      setRemovingIds((current) => current.filter((item) => item !== id));
    }, 180);
  }

  return (
    <section className="sectionBuilder" aria-label="Resume sections">
      <div className="sectionBuilderHeader">
        <div>
          <span>Builder sections</span>
          <small>Add focused resume blocks when you want more structure.</small>
        </div>
        <Button type="button" variant="secondary" onClick={addSection}>
          <Plus size={16} />
          Add
        </Button>
      </div>

      <div className="sectionBuilderList">
        {sections.map((section) => (
          <div
            className={`sectionBuilderCard ${removingIds.includes(section.id) ? 'isRemoving' : ''}`}
            key={section.id}
          >
            <div className="sectionCardTop">
              <input
                value={section.title}
                onChange={(event) => updateSection(section.id, { title: event.target.value })}
                aria-label="Section title"
              />
              <button type="button" className="iconButton" onClick={() => removeSection(section.id)}>
                <Trash2 size={15} />
                <span className="srOnly">Remove section</span>
              </button>
            </div>
            <textarea
              value={section.content}
              onChange={(event) => updateSection(section.id, { content: event.target.value })}
              placeholder="Add concise bullets or details for this section."
              aria-label={`${section.title} content`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
