import { PhotoIcon } from "@heroicons/react/24/outline";

export default function FileUpload({ label = "Upload Image", onFileChange, accept = "image/*" }) {
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileChange?.(file);
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
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
    </div>
  );
}
