import { Picker } from '@react-native-picker/picker';
export const units = ['g', 'oz', 'cup', 'piece'];

export default function UnitPicker({ value, onChange }) {
  return (
      <Picker
          selectedValue={value}
          onValueChange={onChange}
          style={{ color: '#e5e4e2', flex: 1 }}
          dropdownIconColor="#e5e4e2"
      >
        {units.map((u) => (
            <Picker.Item key={u} label={u} value={u} />
        ))}
      </Picker>
  );
}
