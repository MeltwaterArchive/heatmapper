# DataSift Heatmapper

A Node.js app that presents a Google Map and displays a heatmap of interactions coming from the area shown.

# Usage

Start the server:

```bash
$ ./server.js <datasift_username> <datasift_api_key>
```

Then visit http://localhost:3000/ in your browser. The stream does not automatically start so nothing will appear on the map. Locate your target area using the search box and/or panning around and zooming. Enter any additional CSDL you want to run and set the sample rate based on the interaction rate you expect from your query.

Click "restart stream" in the top-right corner to start the stream.

After a couple of seconds you should see the heatmap starting to appear (assuming your stream is getting data).

You can adjust the number of points and it will take effect without the need to restart the stream. You can also clear all existing points at any time (restarting the stream also does this).

If you change the CSDL, sample rate, or the map that's being displayed you must restart the stream to apply those changes. You can move around the map and zoom in and out without affecting the stream that's running.

Note that the app is only designed to support a single client. Multiple clients will cause undesirable behaviour since the last one to restart the stream will define the area, CSDL and sample rate for all connected clients.

# Developer contact

Stuart Dallas<br />
stuart.dallas@datasift.com