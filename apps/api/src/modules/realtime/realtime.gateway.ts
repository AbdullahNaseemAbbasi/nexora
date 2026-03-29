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

  handleConnection(_client: Socket) {}

  handleDisconnect(_client: Socket) {}

  @SubscribeMessage("join-tenant")
  handleJoinTenant(
    @MessageBody() tenantId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`tenant:${tenantId}`);
    return { event: "joined", data: tenantId };
  }

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

  @SubscribeMessage("join-user")
  handleJoinUser(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`user:${userId}`);
    return { event: "joined-user", data: userId };
  }

  emitTaskUpdated(projectId: string, task: any) {
    this.server.to(`project:${projectId}`).emit("task:updated", task);
  }

  emitTaskCreated(projectId: string, task: any) {
    this.server.to(`project:${projectId}`).emit("task:created", task);
  }

  emitTaskDeleted(projectId: string, taskId: string) {
    this.server.to(`project:${projectId}`).emit("task:deleted", { taskId });
  }

  emitNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit("notification:new", notification);
  }

  emitActivity(tenantId: string, activity: any) {
    this.server.to(`tenant:${tenantId}`).emit("activity:new", activity);
  }

  emitTaskComment(projectId: string, taskId: string, comment: any) {
    this.server.to(`project:${projectId}`).emit("task:comment", { taskId, comment });
  }
}
