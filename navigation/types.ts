export type RootStackParamList = {
    // Auth Flow
    Login: undefined;
    Registration: undefined;
    
    // Main App Container
    MainApp: undefined; 

    // MainApp Nested Screens
    Home: undefined; 
    Profile: { userId?: string } | undefined;
    PostScreen: undefined;
    CommentScreen: undefined;
    CommentComposerScreen: undefined;
    Theme: undefined;
    Bookmarks: undefined;
    BookmarkFolder: { folderId?: string; name: string };
};