import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FeedScreen from '../screens/FeedScreen';
import CalorieTrackerScreen from '../screens/CalorieTrackerScreen';
import FoodScannerScreen from '../screens/FoodScannerScreen';
import FitnessScreen from '../screens/FitnessScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FavoriteFoodsScreen from "../screens/FavoriteFoodsScreen";
import PostComposerScreen from "../screens/PostComposerScreen";
import ProfileEditScreen from "../screens/ProfileEditScreen";
import UserProfileScreen from '../screens/UserProfileScreen';
import { useThemeColors } from '../theme/ThemeProvider';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/* ----- stack’ler ----- */
function FeedStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="FeedMain"
                component={FeedScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="PostComposer"
                component={PostComposerScreen}
                options={{ headerShown: true, title: 'Gönderi Oluştur' }}
            />
            <Stack.Screen
                name="UserProfile"
                component={UserProfileScreen}
                options={{ headerShown: true, title: '' }} />
        </Stack.Navigator>
    );
}

function CalorieStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="CalorieMain"
                component={CalorieTrackerScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Favorites"
                component={FavoriteFoodsScreen}
                options={{ headerShown: true, title: 'Favoriler' }}
            />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: true, title: '' }} />
        </Stack.Navigator>
    );
}

function ScannerStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ScannerMain" component={FoodScannerScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: true, title: '' }} />
        </Stack.Navigator>
    );
}
function FitnessStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="FitnessMain" component={FitnessScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: true, title: '' }} />
        </Stack.Navigator>
    );
}
function ProfileStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProfileMain" component={ProfileScreen} />
            <Stack.Screen name="ProfileEdit" component={ProfileEditScreen}
                          options={{ headerShown:true, title:'Profil' }} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: true, title: '' }} />
        </Stack.Navigator>
    );
}

/* ----- bottom-tab ----- */
export default function TabsNavigator() {
    const { accent, text } = useThemeColors();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: accent,
                tabBarInactiveTintColor: text,
                tabBarIcon: ({ focused, color, size }) => {
                    let icon = 'ellipse';
                    switch (route.name) {
                        case 'Feed':
                            icon = focused ? 'people' : 'people-outline';
                            break;
                        case 'Calories':
                            icon = focused ? 'nutrition' : 'nutrition-outline';
                            break;
                        case 'Scanner':
                            icon = focused ? 'barcode' : 'barcode-outline';
                            break;
                        case 'Fitness':
                            icon = focused ? 'barbell' : 'barbell-outline';
                            break;
                        case 'Profile':
                            icon = focused ? 'person' : 'person-outline';
                            break;
                    }
                    return <Ionicons name={icon as any} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Feed" component={FeedStack} />
            <Tab.Screen name="Calories" component={CalorieStack} options={{ title: 'Tracker' }} />
            <Tab.Screen name="Scanner" component={ScannerStack} />
            <Tab.Screen name="Fitness" component={FitnessStack} />
            <Tab.Screen name="Profile" component={ProfileStack} />
        </Tab.Navigator>
    );
}
