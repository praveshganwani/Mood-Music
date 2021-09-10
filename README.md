# Mood-Music !

- This application will take the user’s image from the web camera as an input and detect emotions using Microsoft Cognitive Services Face API and based on the strongest emotion it will design a Spotify Playlist for the user using Spotify API. Therefore, the user can play songs based on his/her current mood.
- Microsoft API scans faces in images and video for the following emotions: anger, contempt, disgust, fear, happiness, neutral, sadness, and surprise.
- When you call the API, it will return a confidence score from 0-1 for each emotion.
- We then use the searchTracks endpoint of Spotify API and make a test call by typing in an emotion in the query parameter (ex. “surprise”).

## UI/UX

<img src="https://user-images.githubusercontent.com/59963061/125198890-6fd7bc00-e281-11eb-8919-1bbbc0da2e98.png" width="90%"></img> <img src="https://user-images.githubusercontent.com/59963061/125198894-736b4300-e281-11eb-9546-b1fe0846c848.png" width="90%"></img> <img src="https://user-images.githubusercontent.com/59963061/125198902-76feca00-e281-11eb-8701-369e83d28082.png" width="90%"></img> 
