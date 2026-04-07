import { View, Text } from 'react-native';

export default function CepResult({ cep }) {
  if (!cep || cep.erro) return null;

  return (
    <View>
      <Text>Rua: {cep.logradouro}</Text>
      <Text>Bairro: {cep.bairro}</Text>
      <Text>Cidade: {cep.localidade}</Text>
      <Text>Estado: {cep.estado}</Text>
    </View>
  );
}