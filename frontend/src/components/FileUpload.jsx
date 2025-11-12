export default function FileUpload({ label, onFileChange, accept = "image/*" }) {
  return (
    <label className="text-sm font-medium text-gray-600">
      {label}
      <input
        type="file"
        accept={accept}
        onChange={(event) => onFileChange?.(event.target.files?.[0] ?? null)}
        className="mt-1 w-full text-sm"
      />
    </label>
  );
}


