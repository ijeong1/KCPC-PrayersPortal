"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { updateProfileInfo } from "@/actions/updateProfileInfo";

export default function ProfileEditModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const { data: session } = useSession();

  const [form, setForm] = useState({
    name: session?.user?.name || "홍길동",
    email: session?.user?.email || "abc@example.com",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateProfileInfo(form);
    if (result.success) {
      setMessage("Saved!");
      await onSave();
      await onClose(); // close modal
    } else {
      setMessage(result.message || "Failed to save");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Complete Your Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {["name", "email"].map((field) => (
            <input
              key={field}
              name={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={(form as any)[field]}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              required
            />
          ))}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded cursor-pointer"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-gray-300 text-black py-2 rounded cursor-pointer"
          >
            Close
          </button>
        </form>
        {message && <p className="text-red-500 mt-2">{message}</p>}
      </div>
    </div>
  );
}
