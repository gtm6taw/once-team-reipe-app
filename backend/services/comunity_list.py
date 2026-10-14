from flask import Flask, jsonify, request, send_from_directory
from db import close_db_resource_safely, execute, get_connection, query, rollback_db_connection_safely
from mysql.connector import Error

def good_add(post_id,user_id):
    if post_id is None or user_id is None:
        return jsonify({"error": "post_idとuser_idは必須です。"}), 400

    try:
        result = execute(
            "INSERT INTO likes (post_id, user_id) VALUES (%s, %s)",
            (post_id, user_id),
        )
        return jsonify({
            "ok": True,
            "post_id": post_id,
            "user_id": user_id,
            "added_count": result["rowcount"],
        })
    except Error as e:
        print("DBエラー", e)
        return jsonify({"error": str(e)}), 500

def good_rem(post_id,user_id):
    if post_id is None or user_id is None:
        return jsonify({"error": "post_idとuser_idは必須です。"}), 400

    try:
        result = execute(
            "DELETE FROM likes WHERE post_id = %s AND user_id = %s",
            (post_id, user_id),
        )
        return jsonify({
            "ok": True,
            "post_id": post_id,
            "user_id": user_id,
            "deleted_count": result["rowcount"],
        })
    except Error as e:
        print("DBエラー", e)
        return jsonify({"error": str(e)}), 500
