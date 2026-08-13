"use client";

import { useState } from "react";
import styles from "@/styles/sections/Admin.module.css";

export default function AttributesTab({ attributes, setAttributes }) {
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editOptions, setEditOptions] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    const res = await fetch("/api/attributes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const attr = await res.json();
    if (res.ok) {
      setAttributes((as) => [...as, attr]);
      setNewName("");
    }
    setBusy(false);
  };

  const startEdit = (a) => {
    setEditId(a.id);
    setEditName(a.name);
    setEditOptions(a.options.join(", "));
  };

  const saveEdit = async () => {
    setBusy(true);
    const options = editOptions.split(",").map((s) => s.trim()).filter(Boolean);
    const res = await fetch("/api/attributes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editId, name: editName, options }),
    });
    const attr = await res.json();
    if (res.ok) {
      setAttributes((as) => as.map((a) => (a.id === attr.id ? attr : a)));
      setEditId(null);
    }
    setBusy(false);
  };

  const remove = async (a) => {
    if (!confirm(`Delete filter "${a.name}"? It will be removed from all products.`)) return;
    await fetch("/api/attributes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id }),
    });
    setAttributes((as) => as.filter((x) => x.id !== a.id));
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <h2>Product Filters ({attributes.length})</h2>
      </div>
      <p className={styles.hint}>
        These become extra filter groups on the Products page — Frame Color, Size, Material and so on.
        Add your own here, then pick a value for each product on the Products tab. Options are comma-separated.
        A filter only shows on the site when at least one product in that category uses it.
      </p>

      <div className={styles.addRow}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New filter name, e.g. Frame Color"
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="pillBtn pillBtn--solid" onClick={add} disabled={busy || !newName.trim()}>
          + Add
        </button>
      </div>

      <div className={styles.list}>
        {attributes.map((a) =>
          editId === a.id ? (
            <div key={a.id} className={`${styles.listItem} ${styles.listItemEdit}`}>
              <div className={styles.editFields}>
                <label className={styles.f}>
                  <span>Filter name</span>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </label>
                <label className={styles.f}>
                  <span>Options (comma-separated)</span>
                  <input
                    value={editOptions}
                    onChange={(e) => setEditOptions(e.target.value)}
                    placeholder="e.g. Red, Green, Blue, Purple, Yellow"
                  />
                </label>
              </div>
              <div className={styles.listBtns}>
                <button className="pillBtn pillBtn--solid" onClick={saveEdit} disabled={busy}>Save</button>
                <button className={styles.ghostBtn} onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div key={a.id} className={styles.listItem}>
              <div className={styles.listInfo}>
                <strong>{a.name}</strong>
                <span>{a.options.length ? a.options.join(" · ") : "No options yet"}</span>
              </div>
              <div className={styles.listBtns}>
                <button className={styles.ghostBtn} onClick={() => startEdit(a)}>Edit</button>
                <button className={styles.dangerBtn} onClick={() => remove(a)}>Delete</button>
              </div>
            </div>
          )
        )}
        {attributes.length === 0 && <p className={styles.emptyMsg}>No extra filters yet.</p>}
      </div>
    </div>
  );
}
