import React, { useState, useEffect } from 'react';
import './App.css';

// PUBLIC_INTERFACE
function App() {
  // State for notes
  const [notes, setNotes] = useState(() =>
    // Persist to/from localStorage for demo; replace this with backend API in real integration
    JSON.parse(localStorage.getItem('notes.app.notes') || '[]')
  );
  // Currently selected note ID
  const [selectedNoteId, setSelectedNoteId] = useState(notes.length > 0 ? notes[0].id : null);
  // Whether we are in editing/creating mode
  const [isEditing, setIsEditing] = useState(false);
  // Edit buffer for note
  const [editBuffer, setEditBuffer] = useState({ title: '', content: '' });

  // Save notes to localStorage as a pseudo-persistence mechanism
  useEffect(() => {
    localStorage.setItem('notes.app.notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    // Update selected note if notes change (e.g., on delete)
    if (notes.length === 0) {
      setSelectedNoteId(null);
      setIsEditing(false);
    } else if (!notes.find((n) => n.id === selectedNoteId)) {
      setSelectedNoteId(notes[0].id);
      setIsEditing(false);
    }
  }, [notes, selectedNoteId]);

  // PUBLIC_INTERFACE
  function handleSelectNote(id) {
    setSelectedNoteId(id);
    setIsEditing(false);
  }

  // PUBLIC_INTERFACE
  function handleStartCreate() {
    setEditBuffer({ title: '', content: '' });
    setIsEditing(true);
    setSelectedNoteId(null);
  }

  // PUBLIC_INTERFACE
  function handleStartEdit() {
    const note = notes.find((n) => n.id === selectedNoteId);
    setEditBuffer(note ? { title: note.title, content: note.content } : { title: '', content: '' });
    setIsEditing(true);
  }

  // PUBLIC_INTERFACE
  function handleDeleteNote(id) {
    if (!window.confirm('Delete this note?')) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  // PUBLIC_INTERFACE
  function handleSaveNote(e) {
    e.preventDefault();
    const trimmedTitle = editBuffer.title.trim();
    if (trimmedTitle === '') {
      alert('Title cannot be empty');
      return;
    }
    if (selectedNoteId && notes.find((n) => n.id === selectedNoteId)) {
      // Editing existing
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedNoteId
            ? { ...n, title: trimmedTitle, content: editBuffer.content }
            : n
        )
      );
      setIsEditing(false);
    } else {
      // Creating new
      const newNote = {
        id: Date.now().toString(),
        title: trimmedTitle,
        content: editBuffer.content,
        created: new Date().toISOString(),
      };
      setNotes((prev) => [newNote, ...prev]);
      setSelectedNoteId(newNote.id);
      setIsEditing(false);
    }
  }

  // PUBLIC_INTERFACE
  function handleCancelEdit() {
    setIsEditing(false);
    if (notes.length > 0 && !selectedNoteId) {
      setSelectedNoteId(notes[0].id);
    }
  }

  // Get note being viewed/edited
  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  return (
    <div className="notes-app-root">
      <header className="notes-header">
        <span className="notes-app-title">📝 NoteEase</span>
        <button className="btn btn-accent" onClick={handleStartCreate}>+ New Note</button>
      </header>
      <main className="notes-main">
        <aside className="notes-sidebar">
          <Sidebar
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelect={handleSelectNote}
            onDelete={handleDeleteNote}
          />
        </aside>
        <section className="notes-content-area">
          {isEditing ? (
            <NoteEditor
              title={editBuffer.title}
              content={editBuffer.content}
              setTitle={(t) => setEditBuffer((eb) => ({ ...eb, title: t }))}
              setContent={(c) => setEditBuffer((eb) => ({ ...eb, content: c }))}
              onSave={handleSaveNote}
              onCancel={handleCancelEdit}
              isNew={!selectedNoteId}
            />
          ) : selectedNote ? (
            <NoteViewer
              note={selectedNote}
              onEdit={handleStartEdit}
              onDelete={() => handleDeleteNote(selectedNote.id)}
            />
          ) : (
            <div className="nothing-selected">
              <p>No note selected.</p>
              <button className="btn btn-accent" onClick={handleStartCreate}>Create a Note</button>
            </div>
          )}
        </section>
      </main>
      <footer className="notes-footer">
        <span>© 2024 NoteEase &middot; Minimal Notes App</span>
      </footer>
    </div>
  );
}

// PUBLIC_INTERFACE
function Sidebar({ notes, selectedNoteId, onSelect, onDelete }) {
  return (
    <div className="sidebar-list">
      {notes.length === 0 ? (
        <div className="sidebar-empty">No notes yet.</div>
      ) : (
        notes.map((note) => (
          <div
            key={note.id}
            className={`sidebar-note-row${note.id === selectedNoteId ? ' selected' : ''}`}
            onClick={() => onSelect(note.id)}
            tabIndex={0}
            aria-label={`View note: ${note.title}`}
          >
            <div className="sidebar-note-meta">
              <span className="sidebar-note-title">{note.title || 'Untitled'}</span>
              <span className="sidebar-note-date">
                {note.created ? new Date(note.created).toLocaleDateString() : ''}
              </span>
            </div>
            <button
              className="sidebar-delete"
              title="Delete note"
              onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
              aria-label={`Delete note ${note.title}`}
            >✕</button>
          </div>
        ))
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
function NoteViewer({ note, onEdit, onDelete }) {
  return (
    <div className="note-viewer">
      <div className="note-view-header">
        <h2 className="note-title">{note.title}</h2>
        <div>
          <button className="btn btn-secondary" onClick={onEdit}>
            Edit
          </button>
          <button className="btn btn-danger" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
      <div className="note-date">
        {note.created ? 'Created: ' + new Date(note.created).toLocaleString() : ''}
      </div>
      <div className="note-content">{note.content ? note.content : <em>No content.</em>}</div>
    </div>
  );
}

// PUBLIC_INTERFACE
function NoteEditor({ title, content, setTitle, setContent, onSave, onCancel, isNew }) {
  return (
    <form className="note-editor" onSubmit={onSave} autoComplete="off">
      <input
        className="note-editor-title"
        placeholder="Title"
        value={title}
        required
        maxLength={80}
        autoFocus
        onChange={e => setTitle(e.target.value)}
      />
      <textarea
        className="note-editor-content"
        placeholder="Write your note here..."
        value={content}
        maxLength={1000}
        rows={12}
        onChange={e => setContent(e.target.value)}
      />
      <div className="note-editor-actions">
        <button className="btn btn-primary" type="submit">
          {isNew ? 'Create' : 'Save'}
        </button>
        <button className="btn btn-secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default App;
