import { useState } from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native'
import {TimelineScreen} from './TimelineScreen'
import { useNavigation } from '@react-navigation/native';

export const HomeScreen = () => {

    const navigation = useNavigation();
    // const renderItem = ({ item }) => (
    //     <PostFactory type={item.type} data={item} />
    // );

    const routes = [
        { key: 'following', title: 'Following', scrollY: 0 },
        { key: 'foryou', title: 'For you', scrollY: 0 },
    ];

    const [currenttab, setCurrentTab] = useState('foryou');

    const setTab = (newTab) =>{
        setCurrentTab(newTab);
        console.log(newTab);
    }

    return (
        <View style={{ flex: 1 }}>
            <TouchableOpacity
                title="Open Drawer"
                onPress={() => navigation.toggleDrawer()}
                style={styles.hamburgerButtonContainer}
                >
                <Image 
                    style={styles.hamburgerButton}
                    source={require('../icons/burger-menu.png')}
                    />
            </TouchableOpacity>
            <View style={styles.tabsContainer}>
            {routes.map((tab) =>
                <TouchableOpacity
                    key={tab.key}
                    style={[styles.tab,
                        currenttab == tab.key && styles.selectedTab
                    ]}
                    onPress={() =>setTab(tab.key)}>
                    <Text>
                        {tab.title}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
        <TimelineScreen tabType = {currenttab}/>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#f4f4f4ff',
        height: '20%',
        justifyContent: 'center',
    },
    tabsContainer: {
        // backgroundColor: '#ff0000ff',
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'row',
    },
    tab: {
        padding: 10,
        paddingBottom: 5,
        paddingTop: 5
    },
    selectedTab:{
        borderBottomWidth: 2,
        borderBottomColor: '#00e5ffff',
    },
    hamburgerButton: {

        padding: 10,
        width: 32,
        height: 32,
    },
    hamburgerButtonContainer: {
        margin: 'auto',
        marginRight: 20,
        width: 32,
        height: 32,
    },
});

export default HomeScreen;