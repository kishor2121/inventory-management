"use client";

import "./organization.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Organization {
  id: string;
  organizationName: string;
  ownerName: string;
  description: string;
  email: string;
  contactNumber: string;
  address: string;
  logo?: string;
  billingRules: string[];
  activeTill?: string;
}

export default function OrganizationDetails() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const res = await fetch("/api/organization/get-organization-info");
        const data = await res.json();

        if (data.success && data.data.length > 0) {
          const org = data.data[0];
          setOrganization(org);
          setNotes(org.billingRules || [""]);
        }
      } catch (err) {
        console.error("Error fetching organization:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, []);

  const addNote = () => setNotes([...notes, ""]);
  const removeNote = (index: number) => setNotes(notes.filter((_, i) => i !== index));
  const updateNote = (index: number, value: string) => {
    const updated = [...notes];
    updated[index] = value;
    setNotes(updated);
  };

  const handleSave = async () => {
    if (!organization) return;

    const payload = {
      ...organization,
      billingRules: notes,
    };

    try {
      const res = await fetch("/api/organization/update-organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Organization updated successfully!");
        router.push("/"); 
      } else {
        alert(data.message || "❌ Failed to update organization");
      }
    } catch (err) {
      console.error("Error updating organization:", err);
      alert("❌ Error updating organization");
    }
  };

  if (loading) return <div className="organization-container">Loading...</div>;
  if (!organization) return <div className="organization-container">No organization found</div>;

  return (
    <div className="organization-container">
      <div className="breadcrumb">
        <span>Home</span> <span className="arrow">›</span> <span>Organization Details</span>
      </div>

      <div className="form-section">
        <div className="left-image">
          <div className="image-circle">
            {organization.logo ? (
              <img
                src={organization.logo}
                alt="Logo"
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <>
                <span>No image</span>
                <div className="camera-icon">📷</div>
              </>
            )}
          </div>
        </div>

        <div className="right-form">
          <div className="row">
            <div className="input-group">
              <label>Organization Name</label>
              <input
                type="text"
                value={organization.organizationName}
                onChange={(e) =>
                  setOrganization({ ...organization, organizationName: e.target.value })
                }
              />
            </div>
            <div className="input-group">
              <label>Owner Name</label>
              <input
                type="text"
                value={organization.ownerName}
                onChange={(e) => setOrganization({ ...organization, ownerName: e.target.value })}
              />
            </div>
          </div>

          <div className="row">
            <div className="input-group full">
              <label>Description</label>
              <input
                type="text"
                value={organization.description}
                onChange={(e) => setOrganization({ ...organization, description: e.target.value })}
              />
            </div>
          </div>

          <div className="row">
            <div className="input-group full">
              <label>Address</label>
              <input
                type="text"
                value={organization.address}
                onChange={(e) => setOrganization({ ...organization, address: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="notes-section">
        <h3>Special Notes</h3>
        {notes.map((note, i) => (
          <div key={i} className="note-row">
            <input
              type="text"
              value={note}
              onChange={(e) => updateNote(i, e.target.value)}
              placeholder="Add note..."
            />
            {notes.length > 1 && (
              <button className="delete-btn" onClick={() => removeNote(i)}>
                🗑️
              </button>
            )}
          </div>
        ))}
        <button className="add-btn" onClick={addNote}>
          + Add More Notes
        </button>
      </div>

      <div className="save-section">
        <button className="save-btn" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}
