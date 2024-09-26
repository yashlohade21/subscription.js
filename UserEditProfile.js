import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Keyboard,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfileField from '../Components/Profile_Field';
import CustomAlert from './CustomAlert';
import {
  API_BASE_URL,
  USER_PROFILE_ENDPOIN,ERROR_MESSAGE
} from '../Constant/ConstantApi';
import messaging from '@react-native-firebase/messaging';
import { useNavigation ,StackActions } from "@react-navigation/native";
const UserEditProfile = (props) => {
  const isFocused = useIsFocused();
  const [userData, setUserData] = useState(null);
  const [errorMessage, setErrorMessage] = React.useState(null);
  const navigation = useNavigation();

  const [inputs, setInputs] = useState({
    name: '',
    userName: '',
    email: '',
    phone: '',
    genderType: '',
    familyType: '',
    pincode: '',
    refreshInterval: '',
    totalMember: '',
    notificationToken: '',
  });
  const [errors, setErrors] = useState({});
  const [fields, setFields] = useState({
    name: 0,
    email: 0,
    phone: 0,
    genderType: 0,
    familyType: 0,
    pincode: 0,
    refreshInterval: 0,
    totalMember: 0,
    notificationToken: 0,
  });

  const [selectedRadio, setSelectedRadio] = useState(
    userData && userData.familyType ? userData.familyType : ''
  );

  const [selectedGender, setSelectedGender] = useState(
    userData && userData.genderType ? userData.genderType : ''
  );

  const FamiltyTypes = [
    { id: 1, name: 'Joint' },
    { id: 2, name: 'Nuclear' },
    { id: 3, name: 'Alone' },
  ];

  const GenderTypes = [
    { id: 1, name: 'Male' },
    { id: 2, name: 'Female' },
    { id: 3, name: 'Other' },
  ]

  const colors = useTheme().colors;
  const theme = useTheme().colors.themeColor;

  const onBack = () => {
    props.navigation.navigate('Profile');
  };

  const validateName = () => {
    Keyboard.dismiss();
    if (!inputs.name) {
      handleError('Please enter name.', 'name');
      return false;
    } else if (!inputs.name.match(/^[\s\S]{2,40}$/)) {
      handleError('Enter valid name.', 'name');
      return false;
    } else if (inputs.name.length > 8) {
      handleError('Enter up to 8 characters only for name.', 'name');
      return false;
    }
    return true;
  };
  const validateEmail = () => {
    Keyboard.dismiss();
    if (!inputs.email) {
      handleError('Please enter email.', 'email');
      return false;
    } else if (
      !inputs.email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9]*$/)
    ) {
      handleError('Enter a valid email address.', 'email');
      return false;
    }
    return true;
  };

  const validatePhone = () => {
    Keyboard.dismiss();
    if (!inputs.phone) {
      handleError('Please input a phone number', 'phone');
      return false;
    } else if (!inputs.phone.match(/^[6-9]\d{9}$/)) {
      handleError('Please input a valid phone number', 'phone');
      return false;
    }
    return true;
  };

  const validatePincode = () => {
    if (!inputs.pincode) {
      return true;
    } else if (!inputs.pincode.match(/^[1-9][0-9]{5}$/)) {
      handleError('Please input a valid pincode', 'pincode');
      return false;
    }
    return true;
  };

  const validateTotal = () => {
    if (!inputs.totalMember) {
      return true;
    } else if (!inputs.totalMember.match(/^[1-9][0-9]*$/)) {
      handleError('Enter a valid number', 'totalMember');
      return false;
    }
    return true;
  };

  const validateTimeInterval = () => {
    if (!inputs.refreshInterval) {
      handleError('Please input a time interval', 'refreshInterval');
      return false;
    } else {
      const intervalValue = parseInt(inputs.refreshInterval, 10);
      if (isNaN(intervalValue) || intervalValue <= 0) {
        handleError(
          'Enter a valid positive integer for the time interval (in minutes)',
          'refreshInterval'
        );
        return false;
      }
    }
    return true;
  };

  const handleOnChange = (text, input) => {
    setInputs((prevState) => ({ ...prevState, [input]: text }));
    setFields((prevState) => ({ ...prevState, [input]: 1 }));
    if (errors[input]) {
      setErrors((prevState) => ({ ...prevState, [input]: null }));
    }
  };
  

  const handleError = (errorMessage, input) => {
    setErrors((prevState) => ({ ...prevState, [input]: errorMessage }));
  };

  const validate = async () => {
    Keyboard.dismiss();
    let valid = true;
    let validName = validateName();
    let validEmail = validateEmail();
    let validPhone = validatePhone();
    let validPincode = validatePincode();
    let validTotal = validateTotal();
    let validTimeInterval = validateTimeInterval();

    if (
      !(
        validName &&
        validEmail &&
        validPhone &&
        validPincode &&
        validTotal &&
        validTimeInterval
      )
    ) {
      valid = false;
    }

    if (valid) {
      try {
        const authToken = await AsyncStorage.getItem('authToken');

        const myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/json');
        myHeaders.append('Authorization', authToken);
        const token = await messaging().getToken();
        myHeaders.append("X-Notification-Token", token);
        const raw = JSON.stringify({
          name: inputs.name,
          email: inputs.email,
          mobileNumber: inputs.phone,
          address: userData.address,
          pincode: inputs.pincode,
          totalMember: inputs.totalMember,
          genderType: inputs.genderType,
          familyType: inputs.familyType,
          language: userData.language,
          currency: userData.currency,
          tags: userData.tags,
          streakCommit: {
            streakCommitName: userData.streakCommit.streakCommitName,
            completed: userData.streakCommit.completed,
          },
          occupation: userData.occupation,
          refreshInterval: inputs.refreshInterval,
          notificationToken: inputs.notificationToken,
        });

        const requestOptions = {
          method: 'PUT',
          headers: myHeaders,
          body: raw,
          redirect: 'follow',
        };

        const response = await fetch(
          `${API_BASE_URL}${USER_PROFILE_ENDPOIN}`, // Update the URL to your endpoint
          requestOptions
        );

        if (response.ok) {
          const result = await response.text();
          props.navigation.navigate('Profile');
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
    }
  };

  const count = () => {
    let count = 0;
    const clickableFields = [
      'name',
      'email',
      'phone',
      'genderType',
      'familyType',
      'pincode',
      'refreshInterval',
      'totalMember',
    ];
    for (let field of clickableFields) {
      if (fields[field] === 1 || inputs[field]) {
        count++;
      }
    }

    return count;
  };

  useEffect(() => {
    if (isFocused) {
      getUserProfile();
    }
  }, [isFocused]);

  useEffect(() => {
    if (userData) {
      setInputs((prevInputs) => ({
        ...prevInputs,
        userName: userData.userName || '',
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.mobileNumber || '',
        genderType: userData.genderType || '',
        familyType: userData.familyType || '',
        pincode: userData.pincode || '',
        totalMember: userData.totalMember || '',
        refreshInterval: userData.refreshInterval.toString() || '1', // Convert to string
        notificationToken: userData.notificationToken || '',
      }));

      setSelectedRadio(userData.familyType || '');

      setInputs((prevInputs) => ({
        ...prevInputs,
        familyType: userData.familyType || '',
      }));

      setSelectedGender(userData.genderType || '');

      setInputs((prevInputs) => ({
        ...prevInputs,
        genderType: userData.genderType || '',
      }));
    }
  }, [userData]);

  const getUserProfile = async () => {
    try {
      const authToken = await AsyncStorage.getItem("authToken");
      const myHeaders = new Headers();
      myHeaders.append("Authorization", authToken);
      const token = await messaging().getToken();
      myHeaders.append("X-Notification-Token", token);
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


  return (
    <View style={styles(colors).container}>
      <View style={styles(colors).innercontainer}>
        <TouchableOpacity onPress={onBack}>
          <Icon name="arrow-back" color={colors.text} size={30} />
        </TouchableOpacity>
        <Text style={styles(colors).heading}>Edit Profile</Text>
        <View style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <ProfileField
              label="User Name"
              onChangeText={(text) => handleOnChange(text, 'userName')}
              error={errors.userName}
              field={fields.userName}
              onFocus={() => {
                handleError(null, 'userName');
              }}
              validateField={() => true} // A function that always returns true for non-editable field
              compulsory={true}
              keyboardType="default"
              value={userData?.userName}
              editable={false} // Make it non-editable
            />

            {/* Editable Name field */}
            <ProfileField
              label="Name"
              onChangeText={(text) => handleOnChange(text, 'name')}
              error={errors.name}
              field={fields.name}
              onFocus={() => {
                handleError(null, 'name');
              }}
              validateField={validateName}
              compulsory={true}
              value={inputs.name}
            />

            <ProfileField
              label="Email Address"
              onChangeText={(text) => handleOnChange(text, 'email')}
              error={errors.email}
              field={fields.email}
              onFocus={() => {
                handleError(null, 'email');
              }}
              validateField={validateEmail}
              compulsory={true}
              keyboardType="email-address"
              value={inputs.email}
              editable={!userData || !userData.email}
            />
            <ProfileField
              label="Phone Number"
              onChangeText={(text) => handleOnChange(text, 'phone')}
              error={errors.phone}
              field={fields.phone}
              onFocus={() => {
                handleError(null, 'phone');
              }}
              validateField={validatePhone}
              compulsory={true}
              keyboardType="numeric"
              value={inputs.phone}
            />

            <Text style={styles(colors).labelTxt}>Gender</Text>
            <View style={styles(colors).options}>
              {GenderTypes.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setSelectedGender(item.name);
                    setInputs((prevState) => ({
                      ...prevState,
                      ['genderType']: item.name,
                    }));
                    setFields((prevState) => ({
                      ...prevState,
                      ['genderType']: 1,
                    }));
                  }}>
                  <View style={styles(colors).radio}>
                    <View style={styles(colors).radioIcon}>
                      {selectedGender === item.name ||
                        inputs.genderType === item.name ? (
                        <View style={styles(colors).radioBg}></View>
                      ) : null}
                    </View>
                    <Text style={styles(colors).radioText}>{item.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles(colors).labelTxt}>Family Type</Text>
            <View style={styles(colors).options}>
              {FamiltyTypes.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setSelectedRadio(item.name);
                    setInputs((prevState) => ({
                      ...prevState,
                      ['familyType']: item.name,
                    }));
                    setFields((prevState) => ({
                      ...prevState,
                      ['familyType']: 1,
                    }));
                  }}>
                  <View style={styles(colors).radio}>
                    <View style={styles(colors).radioIcon}>
                      {selectedRadio === item.name ||
                        inputs.familyType === item.name ? (
                        <View style={styles(colors).radioBg}></View>
                      ) : null}
                    </View>
                    <Text style={styles(colors).radioText}>{item.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <ProfileField
              label="Pincode"
              onChangeText={(text) => handleOnChange(text, 'pincode')}
              error={errors.pincode}
              field={fields.pincode}
              onFocus={() => {
                handleError(null, 'pincode');
              }}
              validateField={validatePincode}
              keyboardType="numeric"
              value={inputs.pincode}
            />
            <ProfileField
              label="Total members in family"
              onChangeText={(text) => handleOnChange(text, 'totalMember')}
              error={errors.totalMember}
              field={fields.totalMember}
              onFocus={() => {
                handleError(null, 'totalMember');
              }}
              validateField={validateTotal}
              keyboardType="numeric"
              value={inputs.totalMember}
            />

            <ProfileField
              label="Refresh time interval for community (in minutes)"
              onChangeText={(text) => handleOnChange(text, 'refreshInterval')}
              error={errors.refreshInterval}
              field={fields.refreshInterval}
              onFocus={() => {
                handleError(null, 'refreshInterval');
              }}
              validateField={validateTimeInterval}
              keyboardType="numeric"
              value={inputs.refreshInterval}  // Make sure this is correctly set
            />

            <View style={styles(colors).complete}>
              <Text style={styles(colors).completeTxt}>Profile Complete</Text>
              <Text style={styles(colors).completeTxt1}>
                {Math.round((count() * 100) / 8)}%
              </Text>
            </View>
            <View
              style={[
                styles(colors).progressBar,
                {
                  width: `${(count() * 100) / 8}%`,
                  borderRadius: count() === 8 ? 20 : 0,
                },
              ]}></View>
            <TouchableOpacity onPress={validate}>
              <View style={styles(colors).button}>
                <Text style={styles(colors).buttonTxt}>Save</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
      {/* Custom Alert for Error Message */}
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
      marginLeft: 20,
      marginRight: 20,
      marginTop: 20,
      flex: 1,
      marginBottom: 5,
    },
    heading: {
      color: colors.text,
      fontSize: 25,
      fontWeight: "700",
      marginBottom: 20,
      marginTop: 20,
    },

    labelTxt: { color: colors.text, fontSize: 15, fontWeight: "500" },
    options: {
      flexDirection: "row",
      marginTop: 10,
      justifyContent: "space-between",
      marginBottom: 20,
    },
    radio: {
      flexDirection: "row",
    },
    radioIcon: {
      height: 20,
      width: 20,
      borderColor: colors.text,
      borderWidth: 2,
      borderRadius: 10,
      marginRight: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    radioBg: {
      backgroundColor: colors.text,
      height: 20,
      width: 20,
      borderRadius: 10,
    },
    radioText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
    },

    complete: { flexDirection: "row", marginBottom: 5 },
    completeTxt: {
      color: colors.text,
      fontSize: 15,
      marginRight: 20,
      fontWeight: "600",
    },
    completeTxt1: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "600",
    },
    progressBar: {
      backgroundColor: colors.text,
      height: 10,
      borderTopLeftRadius: 20,
      borderBottomLeftRadius: 20,
    },
    button: {
      backgroundColor: colors.text,
      width: "50%",
      height: 30,
      borderRadius: 20,
      marginTop: 20,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
    },
    buttonTxt: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.themeColor === "#FFFFFF" ? "white" : "black",
    },
    // New styles for displaying username
    usernameContainer: {
      marginTop: 10,
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    usernameLabel: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '500',
      marginRight: 10,
    },
    usernameText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
  });
export default UserEditProfile;
