import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
  namespace: "/",
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`WS connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`WS disconnected: ${client.id}`);
  }

  // Client joins a tenant room to receive tenant-specific events
  @SubscribeMessage("join-tenant")
  handleJoinTenant(
    @MessageBody() tenantId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`tenant:${tenantId}`);
    return { event: "joined", data: tenantId };
  }

  // Client joins a project room for project-specific events
  @SubscribeMessage("join-project")
  handleJoinProject(
    @MessageBody() projectId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`project:${projectId}`);
    return { event: "joined-project", data: projectId };
  }

  @SubscribeMessage("leave-project")
  handleLeaveProject(
    @MessageBody() projectId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`project:${projectId}`);
  }

  // Emit task updated to all users in a project room
  emitTaskUpdated(projectId: string, task: any) {
    this.server.to(`project:${projectId}`).emit("task:updated", task);
  }

  // Emit task created to project room
  emitTaskCreated(projectId: string, task: any) {
    this.server.to(`project:${projectId}`).emit("task:created", task);
  }

  // Emit task deleted to project room
  emitTaskDeleted(projectId: string, taskId: string) {
    this.server.to(`project:${projectId}`).emit("task:deleted", { taskId });
  }

  // Emit notification to a specific user (by userId room)
  emitNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit("notification:new", notification);
  }

  // Client joins their personal user room for notifications
  @SubscribeMessage("join-user")
  handleJoinUser(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`user:${userId}`);
    return { event: "joined-user", data: userId };
  }

  // Emit activity update to tenant room
  emitActivity(tenantId: string, activity: any) {
    this.server.to(`tenant:${tenantId}`).emit("activity:new", activity);
  }

  // Emit new comment to project room
  emitTaskComment(projectId: string, taskId: string, comment: any) {
    this.server.to(`project:${projectId}`).emit("task:comment", { taskId, comment });
  }
}
