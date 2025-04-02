# RiderConnect
*Real-Time Group Tracking System*
===============================

Welcome to the *Real-Time Group Tracking System! This application allows groups of friends, family, or event participants to **track each other's real-time location* on a map, receive *alerts if anyone exceeds a specified distance, chat with each other, and handle **network disconnections* effectively.

Whether you're on a road trip, attending a festival, or exploring new places, this system ensures that you stay connected, safe, and informed every step of the way.

* * * * *

*Table of Contents*
---------------------

1.  Project Overview
2.  Features
3.  Tech Stack
4.  Installation & Setup
5.  Usage
6.  Folder Structure
7.  Contributing
8.  License

* * * * *

*Project Overview*
--------------------

The *Real-Time Group Tracking System* is designed to:

-   *Track the real-time locations* of all group members.
-   Notify all members when someone exceeds a *defined distance (K distance)* from the rest of the group.
-   Allow users to interact with each other through *real-time chat* within the group.
-   Ensure *unique avatars* for each user for easy identification.
-   Handle *network loss* by notifying the group and sharing the last known location of any member who loses connection.

This application uses *WebSockets* for real-time communication, *MongoDB* for data storage, and integrates *Google Maps API* or *Mapbox* for mapping and location tracking.

* * * * *

*Features*
------------

### *1\. Invite-Based Group Joining*

-   Users can *create a new trip/group* or *join an existing group* using a unique *invite code* or *link*.
-   The process is simple and seamless for everyone involved.

### *2\. Real-Time Location Sharing*

-   Every group member's real-time location is displayed on an *interactive map*.
-   The system continuously updates the location every few seconds to ensure real-time tracking.

### *3\. Distance-Based Notifications*

-   The system calculates the *distance between each user* and sends *notifications to all members* when the distance exceeds a predefined threshold (K distance).
-   This ensures that everyone is aware if someone falls behind or deviates from the group's planned path.

### *4\. Group Chat*

-   A *real-time chat feature* is integrated, allowing users to send messages, share locations, and communicate without leaving the app.
-   The chat is synced with WebSockets to ensure real-time interactions.

### *5\. Unique Avatars*

-   Every user is assigned a *unique avatar* for easier identification on the map and within the chat.
-   Users can customize their avatars or have one auto-generated based on their username or other identifiers.

### *6\. Network Loss Handling*

-   If any user loses network connectivity, the system will:
    -   *Notify the group* that the user has gone offline.
    -   Share their *last known location* with the group to prevent confusion.
    -   Notify the group once the user is back online.

### *7\. Responsive & User-Friendly UI*

-   The user interface is built using *Tailwind CSS* and *ShadCN UI*, providing a clean, modern, and responsive design.
-   It adapts to different screen sizes, ensuring a seamless experience on both desktop and mobile devices.

* * * * *

*Tech Stack*
--------------

This project is built using the following technologies:

-   *Frontend:*

    -   *Next.js* for the React-based frontend framework.
    -   *Tailwind CSS* for utility-first styling.
    -   *ShadCN UI* for prebuilt, customizable UI components.
    -   *Google Maps API / Mapbox* for the real-time location tracking and mapping.
    -   *Socket.io* for real-time communication between users (chat and location updates).
-   *Backend:*

    -   *Node.js* with *Express.js* for handling HTTP requests.
    -   *MongoDB* for storing user and group data.
    -   *Socket.io* for real-time WebSocket communication.
    -   *Clerk* for user authentication (Login/Registration).
-   *Miscellaneous:*

    -   *Geolocation API* for obtaining the user's location.
    -   *Haversine Formula* for calculating the distance between users. 
