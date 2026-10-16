export const openUserProfile = (navigation, userId) => {
    if (userId === undefined || userId === null) return;
    navigation.navigate('MainApp', {
        screen: 'Profile',
        params: { userId: String(userId) },
    });
};