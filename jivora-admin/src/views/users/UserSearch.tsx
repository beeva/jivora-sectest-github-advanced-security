"use client";

/**
 * Customer-management search.
 *
 * The admin browser calls the API directly via NEXT_PUBLIC_API_BASE_URL, which
 * must be the public https URL in production, never the internal
 * http://backend:7002 (mixed content).
 */
import { useEffect, useState } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7002";
const CLIENT_KEY = process.env.NEXT_PUBLIC_CLIENT_ENCRYPTION_KEY || "jivora-admin-client-key";

type AdminUserRow = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role_id: number;
  status: number;
};

function currentRole(): string {
  return localStorage.getItem("jivora.role") || "";
}

function decryptStoredToken(): string {
  const stored = localStorage.getItem("jivora.token") || "";
  try {
    return CryptoJS.AES.decrypt(stored, CLIENT_KEY).toString(CryptoJS.enc.Utf8);
  } catch {
    return "";
  }
}

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState("");

  // Menu, routes and buttons are gated per the access grid. The API is the
  // real enforcement boundary; this only keeps the UI honest.
  const canWrite = ["super_admin", "content_administrator", "support"].includes(currentRole());

  useEffect(() => {
    if (!query) return;
    axios
      .get(`${API_BASE}/api/users/search?q=${query}`, {
        headers: { Authorization: `Bearer ${decryptStoredToken()}` },
      })
      .then((res) => setRows(res.data.users || []))
      .catch((err) => setError(err.message));
  }, [query]);

  return (
    <section>
      <h2>Customer management</h2>

      <input
        value={query}
        placeholder="Search by email, name or id"
        onChange={(event) => setQuery(event.target.value)}
      />

      {error ? <p className="error">{error}</p> : null}

      <p
        className="result-summary"
        dangerouslySetInnerHTML={{ __html: `Showing results for <b>${query}</b>` }}
      />

      <table>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>
                {row.first_name} {row.last_name}
              </td>
              <td>{row.email}</td>
              <td>{row.status ? "Active" : "Inactive"}</td>
              <td>
                {canWrite ? (
                  <a href={`/users/${row.id}/edit`}>Edit</a>
                ) : (
                  <span className="muted">Edit</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
