import { StatusBar } from 'expo-status-bar';
import {
	StyleSheet,
	Text,
	View,
	TouchableOpacity,
	TextInput,
	ScrollView,
	Alert,
	ActivityIndicator,
	Platform,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { theme } from './colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TODO_STORAGE_KEY = '@toDos';
const TAB_STORAGE_KEY = '@isWorking';

export default function App() {
	const [working, setWorking] = useState(true);
	const [text, setText] = useState('');
	const [toDos, setToDos] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [editingText, setEditingText] = useState('');
	const [editingKey, setEditingKey] = useState(null);

	useEffect(() => {
		load();
	}, []);

	const tabIsWorking = isWorking => {
		setWorking(isWorking);
		try {
			AsyncStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(isWorking));
		} catch (error) {
			alert(`error on saving tab status: ${error}`);
		}
	};

	const onChangeText = payload => setText(payload);
	const onChangeEditingText = payload => setEditingText(payload);

	const saveToDos = async toSave => {
		try {
			await AsyncStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(toSave));
		} catch (error) {
			alert(`error on saving to-do: ${error}`);
		}
	};
	const load = async () => {
		try {
			setIsLoading(true);
			try {
				const storageTabInfo = await AsyncStorage.getItem(TAB_STORAGE_KEY);
				if (storageTabInfo) setWorking(JSON.parse(storageTabInfo));
			} catch (error) {
				alert(`error on loading tab status: ${error}`);
			}
			const storageToDoItems = await AsyncStorage.getItem(TODO_STORAGE_KEY);
			console.log(storageToDoItems);
			if (storageToDoItems) setToDos(JSON.parse(storageToDoItems));
			setIsLoading(false);
		} catch (error) {
			alert(`error on loading to-do: ${error}`);
		}
	};

	const addToDo = async () => {
		if (text === '') return;
		const newToDos = Object.assign({}, toDos, {
			[Date.now()]: { text, working, completed: false },
		});
		setToDos(newToDos);
		await saveToDos(newToDos);
		setText('');
	};
	const completeToDo = async key => {
		const newToDos = {
			...toDos,
			[key]: { ...toDos[key], completed: !toDos[key].completed },
		};
		setToDos(newToDos);
		await saveToDos(newToDos);
	};
	const editToDo = async key => {
		if (editingText === '') return;
		const newToDos = Object.assign({}, toDos, {
			[key]: { ...toDos[key], text: editingText },
		});
		setToDos(newToDos);
		await saveToDos(newToDos);
		setEditingText('');
		setEditingKey(null);
	};
	const deleteToDo = key => {
		if (Platform.OS === 'web') {
			const ok = confirm('Do you want to delete this To do?');
			if (ok) {
				const newToDos = { ...toDos };
				delete newToDos[key];
				setToDos(newToDos);
				saveToDos(newToDos);
			}
		} else {
			Alert.alert('Delete To Do', 'Are you sure?', [
				{ text: 'Cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: () => {
						const newToDos = { ...toDos };
						delete newToDos[key];
						setToDos(newToDos);
						saveToDos(newToDos);
					},
				},
			]);
		}
	};

	return (
		<View style={styles.container}>
			<StatusBar style='auto' />
			<View style={styles.header}>
				<TouchableOpacity onPress={() => tabIsWorking(true)}>
					<Text
						style={{ ...styles.btnText, color: working ? 'white' : theme.grey }}
					>
						Work
					</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={() => tabIsWorking(false)}>
					<Text
						style={{
							...styles.btnText,
							color: working ? theme.grey : 'white',
						}}
					>
						Travel
					</Text>
				</TouchableOpacity>
			</View>
			<View>
				<TextInput
					value={text}
					onSubmitEditing={addToDo}
					onChangeText={onChangeText}
					returnKeyType='done'
					placeholder={working ? 'Add a To Do' : 'Where do you want to go?'}
					style={styles.input}
				></TextInput>
			</View>
			{isLoading ? (
				<View
					style={{
						height: '65%',
						flexDirection: 'column',
						justifyContent: 'center',
						alignItems: 'center',
					}}
				>
					<ActivityIndicator color='white' size='large' />
				</View>
			) : (
				<ScrollView>
					{Object.keys(toDos).map(key =>
						toDos[key].working === working ? (
							<View style={styles.toDo} key={key}>
								<View>
									<TouchableOpacity
										style={styles.toDoTitle}
										onPress={() => {
											completeToDo(key);
										}}
									>
										<MaterialCommunityIcons
											name={
												toDos[key].completed
													? 'checkbox-marked'
													: 'checkbox-blank-outline'
											}
											size={icon.size}
											color={toDos[key].completed ? theme.grey : 'white'}
											style={{
												...styles.icon,
												display: editingKey === key ? 'none' : 'flex',
											}}
										/>
										{editingKey !== key ? (
											<Text
												style={
													toDos[key].completed
														? {
																...styles.toDoText,
																...styles.toDoTextCompleted,
														  }
														: styles.toDoText
												}
											>
												{toDos[key].text}
											</Text>
										) : (
											<TextInput
												value={editingText}
												onSubmitEditing={() => editToDo(key)}
												onChangeText={onChangeEditingText}
												returnKeyType='done'
												style={{ ...styles.toDoText, ...styles.toDoTextInput }}
											></TextInput>
										)}
									</TouchableOpacity>
								</View>

								<View style={styles.icons} key={key}>
									{editingKey !== key ? (
										<>
											<TouchableOpacity
												onPress={() => {
													setEditingText(toDos[key].text);
													setEditingKey(key);
												}}
											>
												<MaterialCommunityIcons
													name='tooltip-edit'
													size={icon.size}
													color={theme.grey}
													style={styles.icon}
												/>
											</TouchableOpacity>
											<TouchableOpacity
												onPress={() => {
													deleteToDo(key);
												}}
											>
												<MaterialCommunityIcons
													name='window-close'
													size={icon.size}
													color={theme.red}
													style={styles.icon}
												/>
											</TouchableOpacity>
										</>
									) : (
										<TouchableOpacity
											onPress={() => {
												editToDo(key);
											}}
										>
											<MaterialCommunityIcons
												name='check'
												size={icon.size}
												color={theme.blue}
												style={styles.icon}
											/>
										</TouchableOpacity>
									)}
								</View>
							</View>
						) : null,
					)}
				</ScrollView>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.bg,
		paddingHorizontal: 20,
	},
	header: {
		justifyContent: 'space-between',
		flexDirection: 'row',
		marginTop: 100,
	},
	btnText: {
		fontSize: 38,
		fontWeight: '600',
		color: 'white',
	},
	input: {
		backgroundColor: 'white',
		paddingVertical: 15,
		paddingHorizontal: 20,
		borderRadius: 30,
		marginTop: 20,
		marginBottom: 20,
		fontSize: 18,
	},
	toDo: {
		backgroundColor: theme.toDoBg,
		marginBottom: 10,
		paddingVertical: 20,
		paddingHorizontal: 20,
		borderRadius: 15,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	toDoTitle: {
		flexDirection: 'row',
		marginLeft: -10,
	},
	toDoText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '500',
		marginLeft: 10,
	},
	toDoTextInput: {
		color: theme.grey,
		borderWidth: 1,
		borderColor: theme.grey,
		width: '85%',
	},
	toDoTextCompleted: {
		textDecorationLine: 'line-through',
		color: theme.grey,
	},
	icons: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: -10,
		width: '15%',
	},
	icon: {
		marginLeft: 5,
	},
});

const icon = {
	size: 18,
};
