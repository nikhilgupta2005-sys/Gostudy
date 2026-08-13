"use client";

import { useState } from "react";
import styles from "@/styles/sections/Admin.module.css";

export default function CategoriesTab({ categories, setCategories }) {
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSubs, setEditSubs] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const cat = await res.json();
    if (res.ok) {
      setCategories((cs) => [...cs, cat]);
      setNewName("");
    }
    setBusy(false);
  };

  const startEdit = (c) => {
    setEditId(c.id);
    setEditName(c.name);
    setEditSubs(c.subcategories.join(", "));
  };

  const saveEdit = async () => {
    setBusy(true);
    const subcategories = editSubs.split(",").map((s) => s.trim()).filter(Boolean);
    const res = await fetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editId, name: editName, subcategories }),
    });
    const cat = await res.json();
    if (res.ok) {
      setCategories((cs) => cs.map((c) => (c.id === cat.id ? cat : c)));
      setEditId(null);
    }
    setBusy(false);
  };

  const remove = async (c) => {
    if (!confirm(`Delete category "${c.name}"? Products in it will become uncategorised.`)) return;
    await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id }),
    });
    setCategories((cs) => cs.filter((x) => x.id !== c.id));
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <h2>Categories ({categories.length})</h2>
      </div>
      <p className={styles.hint}>
        Categories control the sidebar menu and the filters on the Products page. Subcategories are comma-separated.
      </p>

      <div className={styles.addRow}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name…"
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="pillBtn pillBtn--solid" onClick={add} disabled={busy || !newName.trim()}>
          + Add
        </button>
      </div>

      <div className={styles.list}>
        {categories.map((c) =>
          editId === c.id ? (
            <div key={c.id} className={`${styles.listItem} ${styles.listItemEdit}`}>
              <div className={styles.editFields}>
                <label className={styles.f}>
                  <span>Name</span>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </label>
                <label className={styles.f}>
                  <span>Subcategories (comma-separated)</span>
                  <input value={editSubs} onChange={(e) => setEditSubs(e.target.value)} placeholder="e.g. Wooden Frame, Aluminum Frame" />
                </label>
              </div>
              <div className={styles.listBtns}>
                <button className="pillBtn pillBtn--solid" onClick={saveEdit} disabled={busy}>Save</button>
                <button className={styles.ghostBtn} onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div key={c.id} className={styles.listItem}>
              <div className={styles.listInfo}>
                <strong>{c.name}</strong>
                <span>{c.subcategories.length ? c.subcategories.join(" · ") : "No subcategories"}</span>
              </div>
              <div className={styles.listBtns}>
                <button className={styles.ghostBtn} onClick={() => startEdit(c)}>Edit</button>
                <button className={styles.dangerBtn} onClick={() => remove(c)}>Delete</button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
