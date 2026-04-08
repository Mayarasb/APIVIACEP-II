import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button,ActivityIndicator, TextInput, FlatList } from 'react-native';

import CepResult from './src/components/CepResult';
import { Banco, createTable, inserirUsuario, atualizarUsuario, selectUsuarios, deletaUsuario } from './src/database/db';


export default function App() {
  const [db, setDb] = useState(null);
  const [cep, setCep] = useState({});
  const[loading, setLoading] =  useState(false);
  const [nome, setNome] = useState('');
  const [cepInput, setCepInput] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [editando, setEditando] = useState(null);
  const [mensagem, setMensagem] = useState({ texto: '', cor: 'red' });

  
    // ── Mensagem ───────────────────────────────
  const exibirMensagem = (texto, cor = 'red') => {
    setMensagem({ texto, cor });
    setTimeout(() => setMensagem({ texto: '', cor: 'red' }), 3000);
  };
  
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

  //Validações

   const validar = () => {
    if (!nome.trim()) {
     exibirMensagem('⚠️ Digite o nome do usuário.');
      return false;
    }
     if (nome.trim().length < 2) {
      exibirMensagem('⚠️ Nome deve ter pelo menos 2 letras.');
      return false;
    }
    if (cepInput.length !== 8) {
       exibirMensagem('⚠️ O CEP deve ter 8 números.');
      return false;
    }
    if (!editando && !cep.logradouro) {
      exibirMensagem('⚠️ Busque o CEP antes de salvar.');
      return false;
    }
    return true;
  };

  const BuscaCep = async (x) => {
    if (x.length !== 8) {
     exibirMensagem('⚠️ Digite um CEP com 8 números.');
      return;
    }
    setLoading(true);
    await fetch(`https://viacep.com.br/ws/${x}/json/`)
      .then(resp => resp.json())
      .then(data => {
        if (data.erro) {
           exibirMensagem('⚠️ CEP não encontrado.');
          setCep({});
        } else {
          setCep(data);
           exibirMensagem('✅ CEP encontrado!', 'green');
        }
      })
      .catch(() => exibirMensagem('⚠️ Falha ao buscar CEP.'));
    setLoading(false);
  };

   const limparCampos = () => {
    setNome('');
    setCepInput('');
    setCep({});
    setEditando(null);
  };

  // ── Preenche campos para edição ───────────
  const handleEditar = (item) => {
    setEditando(item.ID_US);
    setNome(item.NOME_US ?? '');
    setCepInput(item.CEP_US ?? '');
    setCep({
      logradouro: item.LOGRADOURO_US ?? '',
      bairro: item.BAIRRO_US ?? '',
      localidade: item.CIDADE_US ?? '',
      cidade: item.CIDADE_US ?? '',
      estado: item.ESTADO_US ?? '',
    });
    exibirMensagem('✏️ Editando usuário...', 'orange');
  };

 

// Salva usuário no banco
 const handleSalvar = async () => {
    if (!validar()) return;

    if (editando) {
      // atualiza usuário existente
      await atualizarUsuario(db, editando, nome, cepInput, cep.logradouro, cep.bairro, cep.localidade || cep.cidade, cep.estado);
     exibirMensagem('✅ Usuário atualizado!', 'green');
     
    } else {
      // insere novo usuário
      await inserirUsuario(db, nome, cepInput, cep.logradouro, cep.bairro, cep.localidade, cep.estado);
      exibirMensagem('✅ Usuário salvo!', 'green');
    }

    limparCampos();
    const lista = await selectUsuarios(db);
    setUsuarios(lista);
  };

  

  // Deleta usuário
  const handleDeletar = async (id) => {
    await deletaUsuario(db, id);
    const lista = await selectUsuarios(db);
    setUsuarios(lista);
     exibirMensagem('✅ Usuário deletado!', 'green');
  };

  return (
    <View style={styles.container}>

     <Text style={styles.titulo}>
        {editando ? '✏️ Editar Usuário' : '📋 Cadastro de Usuário'}
      </Text>

     {/* Mensagem de validação */}
      {mensagem.texto !== '' && (
        <Text style={[styles.mensagem, { color: mensagem.cor }]}>
          {mensagem.texto}
        </Text>
      )}


      <TextInput
        placeholder="Nome"
        value={nome}
        onChangeText={text => setNome(text)}
        style={styles.input}
      />

      <TextInput
        placeholder="CEP  (somente números)"
        value={cepInput}
       onChangeText={text => setCepInput(text.replace(/\D/g, '').slice(0, 8))}
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
        <Button
          title={editando ? 'Atualizar' : 'Salvar'}
          onPress={handleSalvar}
          color={editando ? 'orange' : 'green'}
        />
      </View>

      {editando && (
        <Button title="Cancelar edição" onPress={limparCampos} color="grey" />
      )}

      <Text style={styles.titulo}>👥 Usuários Cadastrados</Text>


        <FlatList
        data={usuarios}
        keyExtractor={(item) => item.ID_US.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardNome}>{item.NOME_US}</Text>
            <Text>CEP: {item.CEP_US}</Text>
            <Text>{item.LOGRADOURO_US}, {item.BAIRRO_US}</Text>
            <Text>{item.CIDADE_US} - {item.ESTADO_US}</Text>
            <View style={styles.botoesCard}>
              <Button title="Editar" onPress={() => handleEditar(item)} color="orange" />
              <Button title="Deletar" onPress={() => handleDeletar(item.ID_US)} color="red" />
            </View>
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
    borderColor: '#777474',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  espacoBtn: {
    marginVertical: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: '#898888',
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
