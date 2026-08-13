"use client";

import { useState } from "react";
import styles from "@/styles/sections/Admin.module.css";

const BLANK = { name: "", email: "", password: "", role: "admin" };

export default function UsersTab({ users, setUsers, currentUser }) {
  const [form, setForm] = useState(BLANK);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [edit, setEdit] = useState({ name: "", email: "", role: "admin", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isOwner = currentUser.role === "owner";
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setE = (k) => (e) => setEdit({ ...edit, [k]: e.target.value });

  const call = async (method, body) => {
    setBusy(true);
    setError("");
    setNotice("");
    const res = await fetch("/api/users", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return null;
    }
    return data;
  };

  const add = async () => {
    const created = await call("POST", form);
    if (created) {
      setUsers((us) => [...us, created]);
      setForm(BLANK);
      setAdding(false);
      setNotice(`✓ ${created.email} can now sign in.`);
    }
  };

  const startEdit = (u) => {
    setEditId(u.id);
    setEdit({ name: u.name, email: u.email, role: u.role, password: "" });
    setError("");
    setNotice("");
  };

  const saveEdit = async () => {
    const payload = { id: editId, name: edit.name, email: edit.email };
    if (isOwner) payload.role = edit.role;
    if (edit.password) payload.password = edit.password;

    const updated = await call("PUT", payload);
    if (updated) {
      setUsers((us) => us.map((u) => (u.id === updated.id ? updated : u)));
      setEditId(null);
      setNotice(
        edit.password
          ? `✓ Password changed. ${updated.id === currentUser.id ? "You'll need to sign in again." : "Their other sessions were signed out."}`
          : "✓ Saved."
      );
    }
  };

  const remove = async (u) => {
    if (!confirm(`Remove ${u.email}? They will lose dashboard access immediately.`)) return;
    const res = await call("DELETE", { id: u.id });
    if (res) setUsers((us) => us.filter((x) => x.id !== u.id));
  };

  const fmt = (d) => (d ? new Date(d).toLocaleString("en-IN") : "Never");

  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <h2>Admin Users ({users.length})</h2>
        {isOwner && !adding && (
          <button className="pillBtn pillBtn--solid" onClick={() => setAdding(true)}>
            + Add User
          </button>
        )}
      </div>
      <p className={styles.hint}>
        Everyone here can sign in and edit the site. <strong>Owner</strong> accounts can also add,
        edit and remove other users; <strong>admin</strong> accounts can manage the catalogue and
        their own login only. Passwords are stored hashed — nobody, including you, can read them
        back, so reset instead of recovering.
      </p>

      {adding && (
        <div className={`${styles.listItem} ${styles.listItemEdit}`}>
          <div className={styles.editFieldsWide}>
            <label className={styles.f}>
              <span>Name</span>
              <input value={form.name} onChange={set("name")} placeholder="Full name" />
            </label>
            <label className={styles.f}>
              <span>Email</span>
              <input type="email" value={form.email} onChange={set("email")} placeholder="name@example.com" />
            </label>
            <label className={styles.f}>
              <span>Password (min 8 characters)</span>
              <input type="text" value={form.password} onChange={set("password")} placeholder="Share this with them" />
            </label>
            <label className={styles.f}>
              <span>Role</span>
              <select value={form.role} onChange={set("role")}>
                <option value="admin">Admin — manage catalogue</option>
                <option value="owner">Owner — also manage users</option>
              </select>
            </label>
          </div>
          <div className={styles.listBtns}>
            <button className="pillBtn pillBtn--solid" onClick={add} disabled={busy}>
              {busy ? "Adding…" : "Create"}
            </button>
            <button className={styles.ghostBtn} onClick={() => { setAdding(false); setForm(BLANK); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className={styles.errorMsg}>{error}</p>}
      {notice && <p className={styles.savedMsg}>{notice}</p>}

      <div className={styles.list}>
        {users.map((u) =>
          editId === u.id ? (
            <div key={u.id} className={`${styles.listItem} ${styles.listItemEdit}`}>
              <div className={styles.editFieldsWide}>
                <label className={styles.f}>
                  <span>Name</span>
                  <input value={edit.name} onChange={setE("name")} />
                </label>
                <label className={styles.f}>
                  <span>Email</span>
                  <input type="email" value={edit.email} onChange={setE("email")} />
                </label>
                <label className={styles.f}>
                  <span>New password (leave blank to keep)</span>
                  <input type="text" value={edit.password} onChange={setE("password")} placeholder="••••••••" />
                </label>
                {isOwner && (
                  <label className={styles.f}>
                    <span>Role</span>
                    <select value={edit.role} onChange={setE("role")}>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                  </label>
                )}
              </div>
              <div className={styles.listBtns}>
                <button className="pillBtn pillBtn--solid" onClick={saveEdit} disabled={busy}>Save</button>
                <button className={styles.ghostBtn} onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div key={u.id} className={styles.listItem}>
              <div className={styles.listInfo}>
                <strong>
                  {u.name}
                  <em className={u.role === "owner" ? styles.roleOwner : styles.roleAdmin}>{u.role}</em>
                  {u.id === currentUser.id && <em className={styles.youTag}>you</em>}
                </strong>
                <span>{u.email}</span>
                <span>Last signed in: {fmt(u.lastLoginAt)}</span>
              </div>
              <div className={styles.listBtns}>
                {(isOwner || u.id === currentUser.id) && (
                  <button className={styles.ghostBtn} onClick={() => startEdit(u)}>Edit</button>
                )}
                {isOwner && u.id !== currentUser.id && (
                  <button className={styles.dangerBtn} onClick={() => remove(u)}>Remove</button>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
