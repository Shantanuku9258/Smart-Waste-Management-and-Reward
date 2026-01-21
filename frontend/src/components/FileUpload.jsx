import { useState } from "react";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function FileUpload({ label = "Upload Image", onFileChange, accept = "image/*" }) {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      onFileChange?.(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onFileChange?.(null);
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-xl border-2 border-emerald-200 shadow-lg transition-all duration-300 group-hover:shadow-xl"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-full hover:from-red-700 hover:to-rose-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 hover:from-emerald-50 hover:to-teal-50 transition-all duration-300 hover:border-emerald-400 hover:shadow-md">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <PhotoIcon className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 5MB)</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept={accept}
              onChange={handleFileChange}
            />
          </label>
        </div>
      )}
    </div>
  );
}
