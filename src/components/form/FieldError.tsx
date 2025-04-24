type Props = {
  errors: string[];
};

export function FieldError({ errors }: Props) {
  return (
    <ul className="flex flex-col gap-1 list-none">
      {errors.map((error) => (
        <li key={error} className="text-red-500 text-sm">
          {error}
        </li>
      ))}
    </ul>
  );
}
