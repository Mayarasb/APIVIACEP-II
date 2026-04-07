import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button,ActivityIndicator, TextInput, FlatList } from 'react-native';

import CepResult from './src/components/CepResult';
import { Banco, createTable, inserirUsuario, selectUsuarios, deletaUsuario } from './src/database/db';


export default function App() {
  const [db, setDb] = useState(null);
  const [cep, setCep] = useState({});
  const[loading, setLoading] =  useState(false);
  const [nome, setNome] = useState('');
  const [cepInput, setCepInput] = useState('');
  const [usuarios, setUsuarios] = useState([]);

  // Abre banco e cria tabela ao iniciar 

  useEffect(() => {
    async function iniciar() {
      const banco = await Banco();
      await createTable(banco);
      setDb(banco);
      const lista = await selectUsuarios(banco);
      setUsuarios(lista);
    }
    iniciar();
  }, []);
 
  //API FETCH

  const BuscaCep = async (x) => {
    setLoading(true);
    await fetch(`https://viacep.com.br/ws/${x}/json/`)
      .then(resp => resp.json())
      .then(data => setCep(data))
      .catch(error => console.log("Erro: " + error));
    setLoading(false);
  };

// Salva usuário no banco
  const handleSalvar = async () => {
    if (!nome || !cep.logradouro) return;

    await inserirUsuario(db, nome, cepInput, cep.logradouro, cep.bairro, cep.localidade, cep.estado);

    // Limpa campos e atualiza lista
    setNome('');
    setCepInput('');
    setCep({});
    const lista = await selectUsuarios(db);
    setUsuarios(lista);
  };

  // Deleta usuário
  const handleDeletar = async (id) => {
    await deletaUsuario(db, id);
    const lista = await selectUsuarios(db);
    setUsuarios(lista);
  };

  return (
    <View style={styles.container}>

      <Text style = {styles.titulo}>Cadastro de Usuários</Text>

      <TextInput
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
        style={styles.input}
      />

      <TextInput
        placeholder="CEP"
        value={cepInput}
        onChangeText={setCepInput}
        keyboardType="numeric"
        maxLength={8}
        style={styles.input}
      />

      <Button
        title='Buscar CEP' onPress={() => BuscaCep(cepInput)}
      />

      {loading && <ActivityIndicator size="large" color="blue" />}

      <CepResult cep={cep} />

      <View style={styles.espacoBtn}>
 <Button title="Salvar" onPress={handleSalvar} color="green" />
      </View>

      <Text style={styles.titulo}>Usuários Cadastrados</Text>

      <FlatList
        data={usuarios}
        keyExtractor={(item) => item.ID_US.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardNome}>{item.NOME_US}</Text>
            <Text>CEP: {item.CEP_US}</Text>
            <Text>{item.LOGRADOURO_US}, {item.BAIRRO_US}</Text>
            <Text>{item.CIDADE_US} - {item.ESTADO_US}</Text>
            <Button title="Deletar" onPress={() => handleDeletar(item.ID_US)} color="red" />
          </View>
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  espacoBtn: {
    marginVertical: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    gap: 4,
  },
  cardNome: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
});