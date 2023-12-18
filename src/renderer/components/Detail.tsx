export default function DetailPage() {
    return <div className="detail-container">
        <div className="intensity-content">
            <div className="title">地震横波已到达</div>
            <div className="location">四川省成都市高新区</div>
            <div className="distance">震中距你100公里</div>
        </div>
        <div className="intensity-info">
            <div className="item">
                <div className="title">震中</div>
                <div className="content">云南腾冲</div>
            </div>
            <div className="item">
                <div className="title">预警震级</div>
                <div className="content">5.6</div>
            </div>
            <div className="item">
                <div className="title">预估烈度 3.8</div>
                <div className="content">强烈震感</div>
            </div>
        </div>
    </div>
}