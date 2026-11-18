export type AssignmentOption = { id: string; name: string };

export function RoleAssignmentSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: AssignmentOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select
        className="min-h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      >
        <option value="" disabled>
          Selecciona una opción
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
