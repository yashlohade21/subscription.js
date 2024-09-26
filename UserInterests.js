import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import messaging from '@react-native-firebase/messaging';
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme, useIsFocused } from "@react-navigation/native";
import CustomAlert from "./CustomAlert";
import {
  API_BASE_URL,
  TAGS_INTEREST_ENDPOINT,
  USER_PROFILE_ENDPOIN,ERROR_MESSAGE
} from "../Constant/ConstantApi";
import { useNavigation ,StackActions } from "@react-navigation/native";
const UserInterests = (props) => {
  const colors = useTheme().colors;
  const isFocused = useIsFocused();
  const [selected, setSelected] = useState([]);
  const [dataTags, setTagsData] = useState([]);
  const [userData, setUserData] = useState(null); // User profile data
  const [errorMessage, setErrorMessage] = React.useState(null);
  const navigation = useNavigation();
  const onBack = () => {
    props.navigation.navigate("Profile");
  };

  useEffect(() => {
    if (isFocused) {
      setTagsIntrests();
      getUserProfile();
    }
  }, [isFocused]);

  const setTagsIntrests = async () => {
    try {
      const authToken = await AsyncStorage.getItem("authToken");

      const myHeaders = new Headers();
      myHeaders.append("Authorization", authToken);
      const token = await messaging().getToken();
      myHeaders.append("X-Notification-Token",token);
      const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      const response = await fetch(
        `${API_BASE_URL}:${TAGS_INTEREST_ENDPOINT}`,
        requestOptions
      );

      if (response.ok) {
        const result = await response.json();
        setTagsData(result);

        // Fetch previously selected interests from AsyncStorage
        const storedSelectedInterests = await AsyncStorage.getItem(
          "selectedInterests"
        );

        // Update the selected state based on the stored data
        if (storedSelectedInterests) {
          const storedSelected = JSON.parse(storedSelectedInterests);
          setSelected(storedSelected);
        } else {
          setSelected(new Array(result.length).fill(false));
        }
      } else {
        if (response.status === 401) {
          //401 Unauthorize
          setErrorMessage(
            ERROR_MESSAGE
          );
        } else if (response.status === 500) {
          // 500 Internal Server error 
          setErrorMessage(
            ERROR_MESSAGE
          );
        } else if (response.status === 502) {
          // 502 gateway error
          setErrorMessage(
            ERROR_MESSAGE
          );
        } else if (response.status === 504) {
          //504 gateway time out error 
          setErrorMessage(
            ERROR_MESSAGE
          );
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onSelect = (index) => {
    setSelected((prevState) => {
      let newSelected = prevState.map((item, i) => {
        if (i === index) {
          item = !item;
        }
        return item;
      });

      // Update AsyncStorage with the new selected interests
      AsyncStorage.setItem("selectedInterests", JSON.stringify(newSelected));

      return newSelected;
    });
  };

  const getUserProfile = async () => {
    try {
      const authToken = await AsyncStorage.getItem("authToken");

      const myHeaders = new Headers();
      myHeaders.append("Authorization", authToken);
      const token = await messaging().getToken();
      myHeaders.append("X-Notification-Token",token);
      const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      const response = await fetch(
        `${API_BASE_URL}${USER_PROFILE_ENDPOIN}`, // Update the URL to your endpoint
        requestOptions
      );

      if (response.ok) {
        const userData = await response.json(); // Parse the JSON response

        setUserData(userData); // Set the user profile data in state
      } else {
        if (response.status === 401) {
          //401 Unauthorize
          setErrorMessage(
            ERROR_MESSAGE
          );
        } else if (response.status === 500) {
          // 500 Internal Server error 
          setErrorMessage(
            ERROR_MESSAGE
          );
        } else if (response.status === 502) {
          // 502 gateway error
          setErrorMessage(
            ERROR_MESSAGE
          );
        } else if (response.status === 504) {
          //504 gateway time out error 
          setErrorMessage(
            ERROR_MESSAGE
          );
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const setTagsProfile = async () => {
    const payload = dataTags
      .filter((item, index) => selected[index])
      .map((item) => ({ id: item.id, value: item.value }));

    try {
      const authToken = await AsyncStorage.getItem("authToken");
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Authorization", authToken);
      const token = await messaging().getToken();
      myHeaders.append("X-Notification-Token",token);

      const raw = JSON.stringify({
        name: userData.name,
        email: userData.email,
        mobileNumber: userData.mobileNumber,
        address: userData.address,
        pincode: userData.pincode,
        totalMember: userData.totalMember,
        genderType: userData.genderType,
        familyType: userData.familyType,
        language: userData.language,
        currency: userData.currency,
        tags: payload,
        streakCommit: {
          streakCommitName: userData.streakCommit.streakCommitName,
          completed: userData.streakCommit.completed,
        },
        occupation: userData.occupation,
        refreshInterval: userData.refreshInterval,
        notificationToken:userData.notificationToken,
      });

      const requestOptions = {
        method: "PUT",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      const response = await fetch(
        `${API_BASE_URL}${USER_PROFILE_ENDPOIN}`, // Update the URL to your endpoint
        requestOptions
      );

      if (response.ok) {
        const result = await response.text();
        props.navigation.navigate("Profile");
      } else {
        if (response.status === 401) {
          //401 Unauthorize
          setErrorMessage(
            ERROR_MESSAGE
          );
        } else if (response.status === 500) {
          // 500 Internal Server error 
          setErrorMessage(
            ERROR_MESSAGE
          );
        } else if (response.status === 502) {
          // 502 gateway error
          setErrorMessage(
            ERROR_MESSAGE
          );
        } else if (response.status === 504) {
          //504 gateway time out error 
          setErrorMessage(
            ERROR_MESSAGE
          );
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
      <View style={styles(colors).container}>
        <View style={styles(colors).innercontainer}>
          <TouchableOpacity onPress={onBack}>
            <Icon name="arrow-back" color={colors.text} size={30} />
          </TouchableOpacity>
          <Text style={styles(colors).heading}>Select your interests :</Text>
          <View style={{ flex: 1, flexWrap: "wrap" }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {dataTags.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => onSelect(index)}
                  >
                    {!selected[index] ? (
                      <View style={styles(colors).optionBox1}>
                        <View style={styles(colors).option1}>
                          <View style={styles(colors).circle}></View>
                          <Text style={styles(colors).topic1}>
                            {item.value}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles(colors).optionBox2}>
                        <View style={styles(colors).option1}>
                          <Icon
                            name="checkmark-circle"
                            size={18}
                            color={
                              colors.themeColor === "#FFFFFF"
                                ? colors.themeColor
                                : "black"
                            }
                          />
                          <Text style={styles(colors).topic2}>
                            {item.value}
                          </Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles(colors).button}>
              <TouchableOpacity onPress={setTagsProfile}>
                <Text style={styles(colors).buttonTxt}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {errorMessage && (
          <CustomAlert
            type="error"
            message={errorMessage}
            onClose={async () => {
              setErrorMessage(null);
              // Clear all data from AsyncStorage
              await AsyncStorage.clear();
  
              // Use reset to navigate back to the Login screen and reset the stack
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            }}
          />
        )}
      </View>

  );
};

const styles = (colors) =>
  StyleSheet.create({
    container: {
      backgroundColor:
        colors.themeColor === "#FFFFFF" ? colors.themeColor : "#130B4D",
      width: "100%",
      height: "100%",
    },
    innercontainer: {
      marginHorizontal: 20,
      marginTop: 20,
      flex: 1,
    },
    heading: {
      color: colors.text,
      fontSize: 25,
      fontWeight: "bold",
      marginBottom: 20,
      marginTop: 10,
    },
    optionBox1: {
      backgroundColor: colors.themeColor === "#FFFFFF" ? "white" : "black",
      borderWidth: 2,
      borderColor: colors.text,
      borderRadius: 10,
      padding: 8,
      marginBottom: 10,
      alignSelf: "flex-start",
      marginRight: 10,
    },
    option1: {
      flexDirection: "row",
      alignItems: "center",
    },
    circle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: colors.text,
    },
    topic1: {
      color: colors.text,
      fontSize: 18,
      fontWeight: "700",
      marginLeft: 4,
    },
    optionBox2: {
      backgroundColor: colors.themeColor === "#FFFFFF" ? colors.text : "white",
      borderWidth: 1,
      borderColor: colors.text,
      borderRadius: 10,
      padding: 8,
      marginBottom: 10,
      alignSelf: "flex-start",
      marginRight: 10,
    },
    topic2: {
      color: colors.themeColor === "#FFFFFF" ? "white" : "black",
      fontSize: 18,
      fontWeight: "700",
      marginLeft: 4,
    },
    button: {
      height: 50,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonTxt: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.themeColor === "#FFFFFF" ? "white" : "black",
      backgroundColor: colors.text,
      width: 150,
      height: 30,
      borderRadius: 10,
      textAlign: "center",
    },
  });

export default UserInterests;
