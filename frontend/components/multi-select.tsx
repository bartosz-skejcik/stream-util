import MultipleSelector, { Option } from "@/components/ui/multiselect";

type Props = {
  options: Option[];
  selected: Option[];
  onChange: (selected: Option[]) => void;
  label?: string;
  className?: string;
};

export default function MultiSelect({
  options,
  selected,
  onChange,
  className,
}: Props) {
  return (
    <div className="space-y-2">
      <MultipleSelector
        commandProps={{
          label: "Select frameworks",
        }}
        value={selected}
        defaultOptions={options}
        placeholder="Select frameworks"
        onChange={onChange}
        hideClearAllButton
        hidePlaceholderWhenSelected
        emptyIndicator={<p className="text-center text-sm">No results found</p>}
        className={className}
      />
    </div>
  );
}
