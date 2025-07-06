import TextPost from './TextPost';
import ImagePost from './ImagePost';

export default function PostFactory({type, data}) {
    switch(type) {
        case 'text':
            return <TextPost {...data}/>;
        case 'image':
            return <ImagePost {...data}/>;
        default:
            return null;
    }
}