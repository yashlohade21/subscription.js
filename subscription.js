import React, { useState, useEffect, useCallback, useContext } from "react";
import {
    View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Dimensions, Platform, Alert, BackHandler} from "react-native";
import {
    API_BASE_URL, LOGIN_ENDPOINT, USER_PROFILE_ENDPOIN, CONTACT_US, ERROR_MESSAGE } from "../Constant/ConstantApi";
// import Background from "../Components/Background";
import { useTheme, useIsFocused } from "@react-navigation/native";
import plans from "../store/subscriptionPlans";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import CustomAlert from "./CustomAlert";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import { GlobalStateContext } from "../Context/GlobalStateContext";
import { allErrorCodes, getErrorResponse } from "../store/paymentErrorResponse";
import messaging from '@react-native-firebase/messaging';



// import {
//     API_BASE_URL,
//     TAGS_INTEREST_ENDPOINT,
//     USER_PROFILE_ENDPOIN,ERROR_MESSAGE
//   } from "../Constant/ConstantApi";

export var Is_Subscription = false;
var darkMode = false;

const Subscription = ({ route }) => {
    const { SelectSubscriptionPlan, setSelectSubscriptionPlan } = useContext(GlobalStateContext);

    const { selectedIndex } = route.params || {};
    const navigation = useNavigation();
    const [IsSub, setIsSub] = useState(false);
    const isFocused = useIsFocused();
    const [userData, setUserData] = useState(null);
    const basicPlanIndex = plans.findIndex(plan => plan.plantype === "Basic");
    const [selectedItem, setSelectedItem] = useState(basicPlanIndex);
    const [SelectPlan, setSelectPlan] = useState(null);
    const colors = useTheme().colors;
    const theme = useTheme().colors.themeColor;
    const [alertInfo, setAlertInfo] = useState({ type: null, message: '' });
    // const [giveAlert, setGiveAlert] = useState(f)

    const [errorMessage, setErrorMessage] = useState(null)

    const handleErrors = (response) => {
        if (response.status === 401) {
            // 401 Unauthorized
            setErrorMessage(ERROR_MESSAGE);
        } else if (response.status === 500) {
            // 500 Internal Server Error
            setErrorMessage(ERROR_MESSAGE);
        } else if (response.status === 502) {
            // 502 Bad Gateway
            setErrorMessage(ERROR_MESSAGE);
        } else if (response.status === 504) {
            // 504 Gateway Timeout
            setErrorMessage(ERROR_MESSAGE);
        } else if (response.status >= 400 && response.status <= 499) {
            setErrorMessage("No subscription record found");
        } else if (response.status >= 500 && response.status <= 599) {
            setErrorMessage("Server error. Please try again later.");
        } else if (response.status === 401) {
            setErrorMessage("Unauthorized. Please check your credentials.");
        } else {
            setErrorMessage("Unexpected status code: " + response.status + "\n" + ERROR_MESSAGE);
        }
    }

    const fetchData = async () => {
        try {
            const response = await fetch('https://98a9e8f4-0730-4670-9c7d-a4830a4d28ec.mock.pstmn.io/sub/imp');
            if (response.ok) {
                const data = await response.json();
                console.log("Subscription");
                console.log(data)
                if (!data) {
                    console.log('Failed to parse response as JSON');
                }
                if (!data.subscriptionPlan) {
                    console.log('Missing startDate or planType in the response');
                } else {
                    console.log(data.subscriptionPlan)
                    let boolValue = (data.bool === 'true');
                    setSelectSubscriptionPlan({ type: data.subscriptionPlan, bool: boolValue });
                }
            } else {
                handleErrors(response)
            }
        } catch (error) {
            console.error("General error:", error);
        }
    }

    const setData = async (data) => {
        try {
            const response = await fetch('https://98a9e8f4-0730-4670-9c7d-a4830a4d28ec.mock.pstmn.io/sub/imp', {
                method: 'PUT', // or 'PATCH'
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (response.ok) {
                console.log("Successfull SetData To Backend")
            }
            else {
                handleErrors(response)
            }
        } catch (error) {
            console.error("Update error in setData:", error);
            throw error;
        }
    };

    const updateSubscriptionPlan = async (newPlan, newbool, payment_id) => {
        try {
            const data = await fetch('https://98a9e8f4-0730-4670-9c7d-a4830a4d28ec.mock.pstmn.io/sub/imp');
            console.log("updateSubscriptionPlan");
            console.log(data);

            if (!data) {
                console.log('Failed to parse response as JSON');
                return;
            }

            if (data.subscriptionPlan !== newPlan) {
                data.subscriptionPlan = newPlan;
                data.bool = newbool;
                data.transactionKey = payment_id;
                console.log(data)

                await setData(data);
            }

        } catch (error) {
            console.error("General error in updateSubscriptionPlan:", error);
            setErrorMessage("An error occurred while processing your request.");
        }
    };

    useEffect(() => {
        const basicPlanIndex = plans.findIndex(plan => plan.plantype === "Basic");
        if (basicPlanIndex !== -1 && selectedIndex == null) {
            setSelectedItem(basicPlanIndex);
            setSelectPlan(true);
        }
        else {
            setSelectedItem(selectedIndex);
        }

        fetchData();
    }, []);

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                navigation.navigate("HomeScreen");
                return true;
            };

            BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => {
                BackHandler.removeEventListener('hardwareBackPress', onBackPress);
            };
        }, [navigation])
    );

    if (colors.themeColor === '#FFFFFF') {
        darkMode = false
    }
    else {
        darkMode = true
    }
    console.log(darkMode);

    const handleItemPress = (index) => {
        setSelectPlan(true);
        setSelectedItem(index);
    };

    const getTotal = () => {
        let total = 0;
        var selectedPlanCost = plans[selectedItem].cost;
        total = total + selectedPlanCost;
        return total;
    };

    useEffect(() => {
        if (isFocused) {
          getUserProfile();
        }
    }, [isFocused]);
    
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
    
    const handleSelectPlanPress = async () => {
        try {            
            const authToken = await AsyncStorage.getItem('authToken');

            const myHeaders = new Headers();
            myHeaders.append('Content-Type', 'application/json');
            myHeaders.append('Authorization', authToken);
            const token = await messaging().getToken();
            myHeaders.append("X-Notification-Token", token);
            // Request options for fetching user profile
            const requestOptions = {
                method: 'GET',
                headers: myHeaders,
            };
            
            // Fetch user profile data
            const response = await fetch(`${API_BASE_URL}${USER_PROFILE_ENDPOIN}`, requestOptions);
            
            // Handle response
            if (!response.ok) {
                throw new Error('USER DATA IS NOT BEING FETCHED');
            }
            
            const result = await response.json();
            
            // Assuming userData is updated dynamically with fetched data
            userData.name = result.name;
            userData.email = result.email;
            userData.mobileNumber = result.mobileNumber;
            
            if (selectedItem !== null) {
                const selectedPlan = plans[selectedItem].plantype;
                
                // Handle Payment
                const handlePayment = async () => {
                    const options = {
                        description: 'Credits towards consultation',
                        image: require('../../assets/User_Logo.webp'),
                        currency: 'INR',
                        key: 'rzp_test_2DZeUPwGDBDQQn',
                        amount: getTotal() * 100, // Amount in paise (Razorpay expects amount in paise)
                        name: 'FILI: Gamified Financial Literacy App',
                        prefill: {
                            name: userData.name || '',
                            email: userData.email || '',
                            contact: userData.mobileNumber || '',
                        },
                        theme: { color: '#292865' }
                    };
                    
                    try {
                        // Open Razorpay payment gateway
                        const data = await RazorpayCheckout.open(options);

                        // Payment successful
                        updateSubscriptionPlan(selectedPlan, 'true', data.razorpay_payment_id);  // Set 'true' and include payment ID
                        setSelectSubscriptionPlan({ type: selectedPlan, bool: true });

                        // Successful transaction data
                        const transactionData = {
                            user: {
                                name: userData.name,
                                email: userData.email,
                                contact: userData.mobileNumber,
                            },
                            plan: selectedPlan,
                            razorpay_payment_id: data.razorpay_payment_id,
                            razorpay_order_id: data.razorpay_order_id,
                            razorpay_signature: data.razorpay_signature,
                            payment_method: data.method,  // Store the payment method used by the user
                            amount: getTotal(),
                            createdAt: new Date().toISOString(),
                            status: 'success'  // Add a status field for successful transactions
                        };

                        // Store success transaction data in Firebase
                        const firebaseUrl = `https://finedu-decdc-default-rtdb.firebaseio.com/transactions.json`;
                        const firebaseResponse = await fetch(firebaseUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(transactionData),
                        });

                        if (firebaseResponse.ok) {
                            setAlertInfo({
                                type: "success",
                                message: "Payment successful!",
                            });
                        } else {
                            const errorData = await firebaseResponse.json();
                            throw new Error(`Failed to store transaction details: ${errorData.error}`);
                        }

                    } catch (error) {
                        console.error("Error during payment: ", error);

                        // Failed transaction data
                        const failedTransactionData = {
                            user: {
                                name: userData.name,
                                email: userData.email,
                                contact: userData.mobileNumber,
                            },
                            plan: selectedPlan,
                            error: error.message || 'Unknown error', // Capture error message
                            payment_method: error?.method || 'Unknown',  // Capture payment method if available in error
                            amount: getTotal(),
                            createdAt: new Date().toISOString(),
                            status: 'failed'  // Add a status field for failed transactions
                        };

                        // Store failed transaction data in Firebase
                        const firebaseUrl = `https://finedu-decdc-default-rtdb.firebaseio.com/transactions.json`;
                        const firebaseResponse = await fetch(firebaseUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(failedTransactionData),
                        });


                        if (firebaseResponse.ok) {
                            setAlertInfo({
                                type: "failed",
                                message: "Payment failed! Please try again.",
                            });
                        } else {
                            const errorData = await firebaseResponse.json();
                            throw new Error(`Failed to store transaction details: ${errorData.error}`);
                        }
                    }
                };
                
                
                // Plan selection logic
                if (selectedPlan === "Free") {
                    updateSubscriptionPlan(selectedPlan, 'false', null);
                    setSelectSubscriptionPlan({ type: selectedPlan, bool: false });
                    setAlertInfo({ type: "success", message: "Congratulations, You are a free user now!" });
                } else if (selectedPlan === "Basic" || selectedPlan === "Premium") {
                    await handlePayment(); // Trigger payment process
                } else {
                    setAlertInfo({ type: "alert", message: "Oops! You need to choose a valid plan first." });
                }
            } else {
                setAlertInfo({ type: "alert", message: "Please select a plan before proceeding." });
            }
        } catch (error) {
            console.error("Error in handleSelectPlanPress: ", error);
            alert(`Error: ${error.message}`);
        }
    };
    
      


        return (
            // <Background>
            <ScrollView contentContainerStyle={styles(colors).scrollView}>
                {/* {console.log(SelectSubscriptionPlan.bool)} */}
                {errorMessage && (
                    <CustomAlert
                        type={errorMessage === "No subscription record found" ? "warning" : "error"}
                        message={errorMessage}
                        closeTextbutton="Close"
                        onClose={async () => {
                            setErrorMessage(null);
                            // Use reset to navigate back to the Login screen and reset the stack
                            navigation.reset({
                                index: 0,
                                routes: [{ name: "Login" }],
                            });
                        }}
                    />
                )}
                {alertInfo.type === "success" && (
                    <CustomAlert
                        type="success"
                        message={alertInfo.message}
                        closeTextbutton="Let's Go"
                        onClose={() => {
                            setAlertInfo({ type: null, message: '' });
                            navigation.navigate("HomeScreen");
                        }}
                        secondButton={!SelectSubscriptionPlan.bool ? true : undefined}
                        secondButtonText="Upgrade"
                        secondButton_onClose={() => {
                            setAlertInfo({ type: null, message: '' });
                            navigation.navigate("HomeScreen");
                        }}
                    />
                )}
                {alertInfo.type === "failed" && (
                    <CustomAlert
                        type="failed"
                        message={alertInfo.message}
                        closeTextbutton="Try Again"
                        onClose={() => {
                            setAlertInfo({ type: null, message: '' });
                            navigation.navigate("HomeScreen");
                        }}
                    />
                )}
                {alertInfo.type === "alert" && (
                    <CustomAlert
                        type="alert"
                        message={alertInfo.message}
                        link={CONTACT_US}
                        link_text="let us know"
                        closeTextbutton="Close"
                        onClose={() => {
                            setAlertInfo({ type: null, message: '' });
                            navigation.navigate("Subscription");
                        }}
                    />
                )}

                <View style={{ marginHorizontal: Dimensions.get("window").width * 0.02 }}>
                    <Text style={styles(colors).subHeadTxt}>Upgrade Your Plan!</Text>
                </View>

                {plans.map((items, index) => (
                    <TouchableOpacity key={index} onPress={() => handleItemPress(index)}>
                        <View style={[styles(items).subPlanContainer, selectedItem === index && styles(items).subselectedPlanContainerStyle]}>
                            <View style={{ marginLeft: 10 }}>
                                <Text style={[styles(items).subTxtH1, { fontWeight: "900", fontSize: Dimensions.get("window").width * 0.07, color: colors.text }]}>{items.plantype}</Text>
                                <Text style={[styles(items).subSmlTxt, { color: colors.text }]}>{`₹ ${(items.cost / items.duration).toFixed(2)}/Monthly`}</Text>
                            </View>
                            <View>
                                <Text style={[styles(items).subTxtH1, { fontWeight: "900", fontSize: Dimensions.get("window").width * 0.07, color: colors.text }]}>{items.plantxt}</Text>
                                <Text style={[styles(items).subSmlTxt, { color: colors.text }]}>{items.costtext}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    onPress={
                        handleSelectPlanPress
                    }
                    style={[styles(colors).subSelectPlanButton, { backgroundColor: "#4fbdfb" }]}
                >
                    <Text style={styles(colors).subSelectPlanButtonTxt}>Subscribe for ₹{getTotal()}</Text>
                </TouchableOpacity>

                {SelectPlan
                    ? <Text style={[styles(colors).subTxtH1, { marginTop: Dimensions.get("window").height * 0.02 }]}>WHY?</Text>
                    : null}

                {selectedItem !== null && (
                    <View style={styles(plans[selectedItem]).subFeaturesContainer}>
                        {plans[selectedItem].featuresList.map((feature, index) => (
                            <View style={styles(plans[selectedItem]).subFeatureItem} key={index}>
                                <FontAwesome5 name="check-square" size={24} style={[styles(plans[selectedItem]).subFeatureIcon, { color: colors.text }]} />
                                <Text style={[styles(plans[selectedItem]).subFeatureText, { color: colors.text }]}>{feature}</Text>
                            </View>
                        ))}
                    </View>
                )}
                {/* rgb(231,250,252) */}
                <Text style={[styles(colors).subTxtH1, { marginTop: Dimensions.get("window").height * 0.02 }]}>Facing Issue?</Text>

                <View style={{ alignSelf: "center" }}>
                    <Text style={styles(colors).subFeatureText}>info@arglyeenigma.com</Text>
                </View>

            </ScrollView>
        )
    }

    const styles = (colors) =>
        StyleSheet.create({
            scrollView: {
                backgroundColor: colors.themeColor === '#FFFFFF' ? colors.themeColor : '#130B4D',
                flexGrow: 1,
                justifyContent: 'space-between',
            },

            subSmlTxt: {
                gap: 20,
                fontSize: Dimensions.get("window").width * 0.04,
                width: Dimensions.get("window").width * 0.9,
                alignSelf: "center",
                textAlign: "center",
            },

            subMainImage: {
                marginTop: Dimensions.get("window").height * 0.1,
                flexDirection: "row",
                alignItems: "center",
                alignSelf: "center",
            },

            subHeadTxt: {
                fontSize: Dimensions.get("window").width * 0.12,
                color: colors.text,
                fontWeight: "bold",
                textAlign: "center",
                letterSpacing: 1,
            },

            subTxtH1: {
                color: colors.text,
                textTransform: 'capitalize',
                fontWeight: 'bold',
                gap: 20,
                fontSize: Dimensions.get("window").width * 0.05,
                width: Dimensions.get("window").width * 0.9,
                alignSelf: "center",
                textAlign: "center",
            },

            subPlanContainer: {
                padding: 10,
                backgroundColor: colors.bgcolor1,
                justifyContent: 'space-around',
                alignSelf: "center",
                borderWidth: 2,
                flex: 1,
                overflow: 'hidden',
                alignItems: 'center',
                flexDirection: "row",
                width: Dimensions.get("window").width * 0.9,
                borderColor: "gray",
                borderRadius: Dimensions.get("window").width * 0.5,
                marginTop: Dimensions.get("window").height * 0.02,
            },

            subselectedPlanContainerStyle: {
                borderColor: darkMode == false ? "green" : 'lightgreen',
                backgroundColor: darkMode == false ? "lightgreen" : '#141f25',
            },

            subSelectPlanButton: {
                marginTop: Dimensions.get("window").height * 0.02,
                marginBottom: Dimensions.get("window").height * 0.02,
                backgroundColor: colors.text,
                width: "80%",
                height: 50,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "center",
            },

            subSelectPlanButtonTxt: {
                fontSize: 20,
                fontWeight: "bold",
                color: colors.themeColor,
                letterSpacing: 1,
            },

            subFeaturesContainer: {
                marginTop: 10,
                marginLeft: 20,
            },

            subFeatureItem: {
                color: colors.text,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 5,
                marginLeft: 10,
            },

            subFeatureText: {
                color: colors.text,
                textTransform: 'capitalize',
                fontSize: 16.5,
                marginLeft: 10,
            },

            subFeatureIcon: {
                marginRight: 10,
            },

        })

    export default Subscription;
