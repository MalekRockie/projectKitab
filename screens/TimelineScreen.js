import { FlatList, Text, Butto, View } from "react-native";
import { dummyPosts } from "../utils/dummyData";
import PostFactory from '../components/posts/PostFactory';
import TextPost from "../components/posts/TextPost";
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';


export const TimelineScreen = () => {
    
    const navigation = useNavigation();
    const renderItem = ({ item }) => (
        <PostFactory type={item.type} data={item} />
    );

    return (
        <View>
            <TextPost
                id="post123"
                username="johndoe"
                userAvatar="https://i.imgur.com/profile.jpg"
                content="Thiss is a sample text post that demonstrates how the component handles longer content by providing a read more/less toggle when the content exceeds the maximum allowed characters..."
                likes={42}
                comments={7}
                timestamp="2023-05-20T14:30:00Z"
                onLikePress={(postId, newLikeState) => {
                    console.log(`Post ${postId} like status: ${newLikeState}`);
                }}
            />
        </View>
        

            // <Button title="Open Drawer" onPress={() => navigation.toggleDrawer()} />
    );
}

export default TimelineScreen;