/*
 * Server.cpp
 *
 *  Created on: May 4, 2016
 *      Author: ericwadkins
 */

#include "Server.h"

std::vector<std::string> handleRequest(std::string request) {
	std::vector<std::string> response;

	//usleep(5000000);

	response.push_back(std::string(request.replace(0, 4, "Pong")));
	//response.push_back(std::string("CLOSE")); // Close the connection

	return response;
}

void handleConnection(int newsockfd, sockaddr_in* cli_addr) {
	// Initialize buffer to zeros, and read request
	char buffer[256];
	bzero(buffer, 256);

	while (true) {
		int n = read(newsockfd, buffer, 255);
		if (n == 0) {
			std::cout << inet_ntoa(cli_addr->sin_addr) << ":" << ntohs(cli_addr->sin_port)
					<< " connection closed by client" << std::endl;
			//close(newsockfd);
			return;
		}
		else if (n < 0)
			std::cerr << "ERROR reading from socket" << std::endl;

		// Print request
		std::stringstream stream;
		stream << buffer << std::flush;

		while (stream.good()) {
			std::string request;
			getline(stream, request);
			if (request.length() > 0) {
				std::cout << inet_ntoa(cli_addr->sin_addr) << ":" << ntohs(cli_addr->sin_port)
						<< ": " << request << std::endl;

				std::vector<std::string> response = handleRequest(request);

				// Write response
				for (int i = 0; i < response.size(); i++) {
					std::string output = response[i];
					if (output != "CLOSE") {
						n = write(newsockfd, output.c_str(), output.length());
						if (n < 0)
							std::cerr << "ERROR writing to socket" << std::endl;
					}
					else {
						// Close the connection
						close(newsockfd);
						std::cout << inet_ntoa(cli_addr->sin_addr) << ":" << ntohs(cli_addr->sin_port)
								<< " connection terminated" << std::endl;
						return;
					}
				}
			}
		}
	}
}

int main(int argc, const char *argv[]) {
	int sockfd; // Socket file descriptor
	int portno; // Port number

	sockaddr_in serv_addr; // Server address

	if (argc < 2) {
		std::cerr << "ERROR no port provided" << std::endl;
		exit(1);
	}

	// Create new socket, save file descriptor
	sockfd = socket(AF_INET, SOCK_STREAM, 0);
	if (sockfd < 0) {
		std::cerr << "ERROR opening socket" << std::endl;
	}

	// Disables default "wait time" after port is no longer in use before it is unbound
	int reusePort = 1;
	setsockopt(sockfd, SOL_SOCKET, SO_REUSEPORT, &reusePort, sizeof(reusePort));

	// Initialize serv_addr to zeros
	bzero((char *) &serv_addr, sizeof(serv_addr));

	// Reads port number from char* array
	portno = atoi(argv[1]);

	// Sets the address family
	serv_addr.sin_family = AF_INET;
	// Converts number from host byte order to network byte order
	serv_addr.sin_port = htons(portno);
	// Sets the IP address of the machine on which this server is running
	serv_addr.sin_addr.s_addr = INADDR_ANY;

	// Bind the socket to the address
	if (bind(sockfd, (sockaddr *) &serv_addr, sizeof(serv_addr)) < 0)
		std::cerr << "ERROR on binding" << std::endl;

	unsigned int backlogSize = 5; // Number of connections that can be waiting while another finishes
	listen(sockfd, backlogSize);
	std::cout << "C++ server opened on port " << portno << std::endl;;

	while (true) {
		int newsockfd; // New socket file descriptor
		unsigned int clilen; // Client address size
		sockaddr_in cli_addr; // Client address

		// Block until a client connects
		clilen = sizeof(sockaddr_in);
		newsockfd = accept(sockfd, (sockaddr *) &cli_addr, &clilen);
		if (newsockfd < 0)
			std::cerr << "ERROR on accept" << std::endl;

		std::cout << inet_ntoa(cli_addr.sin_addr) << ":" << ntohs(cli_addr.sin_port)
				<< " connected" << std::endl;

		handleConnection(newsockfd, &cli_addr);
	}

	return 0;
}

