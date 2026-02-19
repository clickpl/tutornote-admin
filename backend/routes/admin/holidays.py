"""
휴일 관리 API 엔드포인트 (TMA - Master Admin)

대한민국 공휴일을 관리합니다.

API:
    GET /api/admin/holidays - 공휴일 목록 조회
    POST /api/admin/holidays - 공휴일 추가
    PUT /api/admin/holidays/<id> - 공휴일 수정
    DELETE /api/admin/holidays/<id> - 공휴일 삭제
    POST /api/admin/holidays/bulk - 연도별 공휴일 일괄 등록
"""

import os
from datetime import datetime
from flask import Blueprint, jsonify, request

import sys
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, PROJECT_ROOT)


holidays_bp = Blueprint('holidays', __name__)


def get_db_connection():
    """데이터베이스 연결"""
    try:
        import mysql.connector
        return mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'tutornote')
        )
    except Exception as e:
        print(f"[Holidays API] DB connection failed: {e}")
        return None


# =============================================================================
# 공휴일 목록 조회
# =============================================================================
@holidays_bp.route('/api/admin/holidays', methods=['GET'])
def get_holidays():
    """공휴일 목록 조회"""
    year = request.args.get('year', datetime.now().year, type=int)

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, date, name, type, year, is_recurring,
                   recurring_month, recurring_day, created_at, updated_at
            FROM holidays
            WHERE year = %s
            ORDER BY date
        """, (year,))

        holidays = cursor.fetchall()

        for h in holidays:
            h['date'] = h['date'].strftime('%Y-%m-%d')
            if h.get('created_at'):
                h['created_at'] = h['created_at'].strftime('%Y-%m-%d %H:%M:%S')
            if h.get('updated_at'):
                h['updated_at'] = h['updated_at'].strftime('%Y-%m-%d %H:%M:%S')

        return jsonify({
            'success': True,
            'year': year,
            'holidays': holidays,
            'count': len(holidays)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# =============================================================================
# 공휴일 추가
# =============================================================================
@holidays_bp.route('/api/admin/holidays', methods=['POST'])
def create_holiday():
    """공휴일 추가"""
    data = request.json

    date_str = data.get('date')
    name = data.get('name')
    holiday_type = data.get('type', 'national')
    is_recurring = data.get('is_recurring', False)
    recurring_month = data.get('recurring_month')
    recurring_day = data.get('recurring_day')

    if not date_str or not name:
        return jsonify({'error': 'date와 name은 필수입니다'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 연도 추출
        year = int(date_str[:4])

        cursor.execute("""
            INSERT INTO holidays (date, name, type, year, is_recurring, recurring_month, recurring_day)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (date_str, name, holiday_type, year, is_recurring, recurring_month, recurring_day))

        conn.commit()
        holiday_id = cursor.lastrowid

        return jsonify({
            'success': True,
            'message': '공휴일이 추가되었습니다',
            'id': holiday_id
        }), 201

    except Exception as e:
        conn.rollback()
        if 'Duplicate entry' in str(e):
            return jsonify({'error': '해당 날짜에 이미 공휴일이 등록되어 있습니다'}), 400
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# =============================================================================
# 공휴일 수정
# =============================================================================
@holidays_bp.route('/api/admin/holidays/<int:holiday_id>', methods=['PUT'])
def update_holiday(holiday_id):
    """공휴일 수정"""
    data = request.json

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 존재 확인
        cursor.execute("SELECT id FROM holidays WHERE id = %s", (holiday_id,))
        if not cursor.fetchone():
            return jsonify({'error': '공휴일을 찾을 수 없습니다'}), 404

        # 업데이트
        update_fields = []
        update_values = []

        if 'date' in data:
            update_fields.append('date = %s')
            update_values.append(data['date'])
            # 연도도 업데이트
            update_fields.append('year = %s')
            update_values.append(int(data['date'][:4]))
        if 'name' in data:
            update_fields.append('name = %s')
            update_values.append(data['name'])
        if 'type' in data:
            update_fields.append('type = %s')
            update_values.append(data['type'])
        if 'is_recurring' in data:
            update_fields.append('is_recurring = %s')
            update_values.append(data['is_recurring'])
        if 'recurring_month' in data:
            update_fields.append('recurring_month = %s')
            update_values.append(data['recurring_month'])
        if 'recurring_day' in data:
            update_fields.append('recurring_day = %s')
            update_values.append(data['recurring_day'])

        if update_fields:
            update_values.append(holiday_id)
            cursor.execute(f"""
                UPDATE holidays
                SET {', '.join(update_fields)}
                WHERE id = %s
            """, update_values)
            conn.commit()

        return jsonify({
            'success': True,
            'message': '공휴일이 수정되었습니다'
        })

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# =============================================================================
# 공휴일 삭제
# =============================================================================
@holidays_bp.route('/api/admin/holidays/<int:holiday_id>', methods=['DELETE'])
def delete_holiday(holiday_id):
    """공휴일 삭제"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("DELETE FROM holidays WHERE id = %s", (holiday_id,))

        if cursor.rowcount == 0:
            return jsonify({'error': '공휴일을 찾을 수 없습니다'}), 404

        conn.commit()

        return jsonify({
            'success': True,
            'message': '공휴일이 삭제되었습니다'
        })

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# =============================================================================
# 연도별 공휴일 일괄 등록
# =============================================================================
@holidays_bp.route('/api/admin/holidays/bulk', methods=['POST'])
def bulk_create_holidays():
    """
    연도별 공휴일 일괄 등록

    Body:
        year: 연도
        holidays: [{date, name, type}, ...]
    """
    data = request.json
    year = data.get('year')
    holidays = data.get('holidays', [])

    if not year or not holidays:
        return jsonify({'error': 'year와 holidays는 필수입니다'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'DB connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        inserted = 0
        skipped = 0

        for h in holidays:
            try:
                cursor.execute("""
                    INSERT IGNORE INTO holidays (date, name, type, year)
                    VALUES (%s, %s, %s, %s)
                """, (h['date'], h['name'], h.get('type', 'national'), year))

                if cursor.rowcount > 0:
                    inserted += 1
                else:
                    skipped += 1
            except Exception as e:
                print(f"[Holidays] Bulk insert error: {e}")
                skipped += 1

        conn.commit()

        return jsonify({
            'success': True,
            'message': f'{inserted}개의 공휴일이 등록되었습니다 (중복 {skipped}개 스킵)',
            'inserted': inserted,
            'skipped': skipped
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# =============================================================================
# 대한민국 공휴일 템플릿 조회
# =============================================================================
@holidays_bp.route('/api/admin/holidays/template/<int:year>', methods=['GET'])
def get_holiday_template(year):
    """
    특정 연도의 대한민국 공휴일 템플릿 반환

    Note: 음력 공휴일(설날, 추석, 부처님오신날)은 매년 날짜가 다르므로
    별도 업데이트가 필요합니다.
    """

    # 양력 고정 공휴일
    fixed_holidays = [
        {'date': f'{year}-01-01', 'name': '신정', 'type': 'national'},
        {'date': f'{year}-03-01', 'name': '삼일절', 'type': 'national'},
        {'date': f'{year}-05-05', 'name': '어린이날', 'type': 'national'},
        {'date': f'{year}-06-06', 'name': '현충일', 'type': 'national'},
        {'date': f'{year}-08-15', 'name': '광복절', 'type': 'national'},
        {'date': f'{year}-10-03', 'name': '개천절', 'type': 'national'},
        {'date': f'{year}-10-09', 'name': '한글날', 'type': 'national'},
        {'date': f'{year}-12-25', 'name': '크리스마스', 'type': 'national'},
    ]

    # 음력 공휴일 (연도별 업데이트 필요)
    lunar_holidays_by_year = {
        2025: [
            {'date': '2025-01-28', 'name': '설날 연휴', 'type': 'national'},
            {'date': '2025-01-29', 'name': '설날', 'type': 'national'},
            {'date': '2025-01-30', 'name': '설날 연휴', 'type': 'national'},
            {'date': '2025-05-05', 'name': '부처님오신날', 'type': 'national'},
            {'date': '2025-10-05', 'name': '추석 연휴', 'type': 'national'},
            {'date': '2025-10-06', 'name': '추석', 'type': 'national'},
            {'date': '2025-10-07', 'name': '추석 연휴', 'type': 'national'},
        ],
        2026: [
            {'date': '2026-02-16', 'name': '설날 연휴', 'type': 'national'},
            {'date': '2026-02-17', 'name': '설날', 'type': 'national'},
            {'date': '2026-02-18', 'name': '설날 연휴', 'type': 'national'},
            {'date': '2026-05-24', 'name': '부처님오신날', 'type': 'national'},
            {'date': '2026-09-24', 'name': '추석 연휴', 'type': 'national'},
            {'date': '2026-09-25', 'name': '추석', 'type': 'national'},
            {'date': '2026-09-26', 'name': '추석 연휴', 'type': 'national'},
        ],
        2027: [
            {'date': '2027-02-06', 'name': '설날 연휴', 'type': 'national'},
            {'date': '2027-02-07', 'name': '설날', 'type': 'national'},
            {'date': '2027-02-08', 'name': '설날 연휴', 'type': 'national'},
            {'date': '2027-05-13', 'name': '부처님오신날', 'type': 'national'},
            {'date': '2027-09-14', 'name': '추석 연휴', 'type': 'national'},
            {'date': '2027-09-15', 'name': '추석', 'type': 'national'},
            {'date': '2027-09-16', 'name': '추석 연휴', 'type': 'national'},
        ],
    }

    lunar_holidays = lunar_holidays_by_year.get(year, [])
    all_holidays = fixed_holidays + lunar_holidays
    all_holidays.sort(key=lambda x: x['date'])

    return jsonify({
        'success': True,
        'year': year,
        'holidays': all_holidays,
        'count': len(all_holidays),
        'note': '음력 공휴일(설날, 추석, 부처님오신날)은 연도별로 날짜가 다릅니다.'
    })


def register_holidays_routes(app):
    """Holidays Blueprint 등록"""
    app.register_blueprint(holidays_bp)
