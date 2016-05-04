import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Server {

	public static void main(String[] args) {
		int port = 8080;
		boolean debug = false;
		Map<String, String> argMap = new HashMap<>();
		for (String arg : args) {
			String[] params = arg.split(" ");
			for (String param : params) {
				int index = param.indexOf("=");
				String key = param.substring(0, index);
				String value = param.substring(index + 1);
				argMap.put(key,  value);
			}
		}
		if (argMap.containsKey("port")) {
			try {
				port = Integer.parseInt(argMap.get("port"));
			} catch (NumberFormatException e) {
				System.out.println(e.getMessage());
			}
		}
		if (argMap.containsKey("debug")) {
			debug = Boolean.parseBoolean(argMap.get("debug"));
		}
		serve(port, debug);
    }

	public static void serve(final int port, final boolean debug) {
		// Open server as resource
		try (ServerSocket server = new ServerSocket(port)) {
			System.out.println("Server opened on port " + port);
	        while (true) {
	            // block until a client connects, then repeat
	            final Socket socket = server.accept();
	            if (debug)
	            	System.out.println(socket.getRemoteSocketAddress() + " connected");
	            
	            // Handle the connection
	            Thread handler = new Thread(new Runnable() {
					public void run() {
						try {
							handleConnection(socket, debug);
						} catch (IOException e) {
							e.printStackTrace();
						}
					}
	            });
	            handler.start();
	        }
		} catch (IOException e) {
			e.printStackTrace();
		}
    }
	
	public static void handleConnection(Socket socket, final boolean debug) throws IOException {
		// Create input reader and output writer
		BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
        PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
        
        // Read input
        String line;
        while (!socket.isClosed() && (line = in.readLine()) != null) {
        	if (debug)
        		System.err.println(socket.getRemoteSocketAddress() + ": " + line);
        	
        	// Handle request
        	List<String> response = handleRequest(line, socket);
        	
        	// Check connection status
        	if (socket.isClosed()) {
        		break;
        	}
        	
        	// Write response
        	for (String output : response) {
        		if (output != null) {
        			out.println(output);
        		}
        		else {
        			socket.close();
        			if (debug)
        				System.out.println(socket.getRemoteSocketAddress() + " connection terminated");
        			return;
        		}
        	}
        }
        
        if (debug)
        	System.out.println(socket.getRemoteSocketAddress() + " connection closed by client");
        
	}
	
	public static List<String> handleRequest(String request, Socket socket) {
		List<String> response = new ArrayList<>();
		
		response.add("Message received");
		response.add(null); // Close connection
		
		return response;
	}
	
}
