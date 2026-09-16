export function inputValue(event: Event): string {
  return (event.target as HTMLInputElement).value;
}

export function selectValue(event: Event): string {
  return (event.target as HTMLSelectElement).value;
}
