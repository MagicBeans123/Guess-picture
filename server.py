# -*- coding: utf-8 -*-
"""
猜画画 - 后端服务
使用国内智谱 AI 视觉接口识别简笔画，展厅无法访问 Google 时可用本服务。
"""
import os
import re
import base64
import json
import uuid
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    import requests
except ImportError:
    requests = None

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

ZHIPU_API_KEY = os.environ.get('ZHIPU_API_KEY', '')
ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
MODEL = 'glm-4v-flash'
PUBLIC_URL = (os.environ.get('PUBLIC_URL') or '').rstrip('/')

_temp_images = {}


def guess_drawing(image_base64_or_data_url):
    if not ZHIPU_API_KEY:
        return None, '未配置 ZHIPU_API_KEY，请在 .env 或环境变量中设置'
    if not requests:
        return None, '请安装依赖: pip install requests'

    if image_base64_or_data_url.startswith('data:'):
        b64 = image_base64_or_data_url.split(',', 1)[-1].strip()
    else:
        b64 = image_base64_or_data_url.strip()

    try:
        raw = base64.b64decode(b64)
    except Exception as e:
        return None, '图片 base64 解码失败: ' + str(e)

    temp_id = None
    if PUBLIC_URL:
        temp_id = str(uuid.uuid4())
        _temp_images[temp_id] = raw
        image_url = PUBLIC_URL + '/temp/' + temp_id + '.png'
    else:
        image_url = 'data:image/png;base64,' + b64

    prompt = (
        '这是一张用户在白底上手绘的简笔画/涂鸦。请只看这张图，用中文回答：画的是什么东西？'
        '只回答一个词或一个短语（例如：猫、太阳、房子、汽车、树、雨伞），不要加句号、不要解释。'
        '如果完全看不出是什么，就回答：无法识别。'
    )

    payload = {
        'model': MODEL,
        'messages': [
            {
                'role': 'user',
                'content': [
                    {'type': 'image_url', 'image_url': {'url': image_url}},
                    {'type': 'text', 'text': prompt}
                ]
            }
        ],
        'max_tokens': 64,
        'temperature': 0.2
    }

    headers = {
        'Authorization': 'Bearer ' + ZHIPU_API_KEY,
        'Content-Type': 'application/json'
    }

    try:
        r = requests.post(ZHIPU_API_URL, headers=headers, json=payload, timeout=30)
        data = r.json()
    except requests.exceptions.Timeout:
        if temp_id:
            _temp_images.pop(temp_id, None)
        return None, '请求智谱 API 超时'
    except requests.exceptions.RequestException as e:
        if temp_id:
            _temp_images.pop(temp_id, None)
        return None, '请求失败: ' + str(e)
    except json.JSONDecodeError:
        if temp_id:
            _temp_images.pop(temp_id, None)
        return None, '响应解析失败'

    if r.status_code != 200:
        if temp_id:
            _temp_images.pop(temp_id, None)
        err = data.get('error', {}) if isinstance(data, dict) else {}
        msg = err.get('message', data.get('message', r.text))
        return None, '智谱 API 错误(%s): %s' % (r.status_code, msg)

    choices = data.get('choices')
    if not choices or not choices[0].get('message', {}).get('content'):
        return None, '智谱返回内容为空'

    text = (choices[0]['message']['content'] or '').strip()
    text = re.sub(r'[。.]+$', '', text.split('\n')[0].strip())
    if not text or text == '无法识别':
        if temp_id:
            _temp_images.pop(temp_id, None)
        return None, '未识别出内容'

    if temp_id:
        _temp_images.pop(temp_id, None)
    return {'label': text, 'confidence': 0.9}, None


@app.route('/temp/<tid>.png')
def serve_temp_image(tid):
    raw = _temp_images.pop(tid, None)
    if raw is None:
        return '', 404
    return Response(raw, mimetype='image/png')


@app.route('/api/guess', methods=['POST'])
def api_guess():
    body = request.get_json(force=True, silent=True) or {}
    image = body.get('image') or body.get('image_base64')
    if not image:
        return jsonify({'error': '缺少 image 字段'}), 400

    result, err = guess_drawing(image)
    if err:
        return jsonify({'error': err}), 200

    return jsonify({'label': result['label'], 'confidence': result.get('confidence', 0.9)})


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def static_files(path):
    if os.path.isfile(path):
        return send_from_directory('.', path)
    return send_from_directory('.', 'index.html')


if __name__ == '__main__':
    if not ZHIPU_API_KEY:
        print('警告: 未设置 ZHIPU_API_KEY，识别接口将返回错误。')
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_DEBUG') == '1')
