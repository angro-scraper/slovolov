enum LocalRole { child, parent, contentAdmin }

class PermissionDenied implements Exception {
  const PermissionDenied(this.message);
  final String message;

  @override
  String toString() => message;
}

class AuditEntry {
  const AuditEntry({
    required this.actorId,
    required this.action,
    required this.detail,
    required this.createdAt,
  });

  final String actorId;
  final String action;
  final String detail;
  final DateTime createdAt;
}
