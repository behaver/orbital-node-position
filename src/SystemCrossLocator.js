'use strict';

const { CelestialLocator, CelestialCoordinate } = require('@behaver/celestial-coordinate');
const { NewtonSolver } = require('@behaver/unary-toolkit');
const { JDateRepository } = require('@behaver/jdate');

/**
 * SystemCrossLocator
 *
 * 天球系统交点定位器
 *
 * @author 董 三碗 <qianxing@yeah.net>
 */
class SystemCrossLocator extends CelestialLocator {

  /**
   * 构造函数
   * 
   * @param {Object} options 定位器计算参数
   */
  constructor(options = {}) {
    super(options);

    this.private = {
      ...this.private,
      id: 'sys_cross',
      time: new JDateRepository,
      direction: true,
    }

    this.options(options);
  }

  /**
   * 设置定位器计算参数
   * 
   * @param  {String}             options.id        位置id
   * @param  {JDateRepository}    options.time      儒略时间对象
   * @param  {String}             options.sysA      天球系统A
   * @param  {String}             options.sysB      天球系统B
   * @param  {Object}             options.sysOpts   天球系统参数项
   * @param  {Boolean}            options.direction 交点方向
   * 
   * @return {SystemCrossLocator}                   返回 this 引用
   */
  options({
    id,
    time,
    sysA,
    sysB,
    sysOpts,
    direction,
  } = {}) {
    if (id !== undefined) this.id = id;
    if (time !== undefined) this.time = time;
    if (sysA !== undefined) this.sysA = sysA;
    if (sysB !== undefined) this.sysB = sysB;
    if (sysOpts !== undefined) this.sysOpts = sysOpts;
    if (direction !== undefined) this.direction = direction;

    return this;
  }

  /**
   * 获取计算结果
   *
   * @param  {Object} options 定位器计算参数
   * 
   * @return {Object}         计算结果集
   */
  get(options = {}) {

    this.options(options);

    // 声明变量
    let sysOpts = this.sysOpts,
        sysA = this.sysA,
        sysB = this.sysB;

    // 创建系统 A 的天球坐标对象
    let CC = new CelestialCoordinate({
          ...sysOpts,
          epoch: this.time,
        }),
        coordA = CC.create(this.sysA, {
          longitude: 0,
          latitude: 0,
        }),
        coordB;

    // 构建用于迭代求解的函数
    let f = function(longitude) {
      // 调整原天球坐标经度值
      coordA.longitude = longitude;

      // 转换为天球系统 B 坐标
      coordB = CC.transform(coordA).to(sysB, sysOpts);

      return coordB.latitude.getDegrees();
    }

    // 构建牛顿线性求解器
    let NLSolver = new NewtonSolver({
      f,
      dx: 0.0001,
      bias: 0.0001,
      // maxIteration: 10,
    });

    // 执行求解
    NLSolver.solve(0);

    // 处理获取迭代方向
    let derivative = NLSolver.derivative;

    // 处理交点方向问题
    if (this.direction == (derivative > 0)) {
      coordB.longitude = coordB.longitude.getDegrees() - 180;
      coordB.latitude = - coordB.latitude.getDegrees();
    }

    // 生成结果对象
    let res = {
      id: this.id,
      time: this.time,
      coord: CC.create(sysB, { sc: coordB.sc }),
      coordA: CC.create(sysA, { sc: coordA.sc }),
    };

    res.coordB = res.coord;

    return res;
  }

  /**
   * 设置 天球系统 A
   * 
   * @param {String} value 天球系统 A
   */
  set sysA(value) {
    this.private.sysA = value;
  }

  /**
   * 获取 天球系统 A
   * 
   * @return {String} 天球系统 A
   */
  get sysA() {
    return this.private.sysA;
  }

  /**
   * 设置 天球系统 B
   * 
   * @param {String} value 天球系统 B
   */
  set sysB(value) {
    this.private.sysB = value;
  }

  /**
   * 获取 天球系统 B
   * 
   * @return {String} 天球系统 B
   */
  get sysB() {
    return this.private.sysB;
  }

  /**
   * 设置 天球系统配置参数
   * 
   * @param {Object} value 天球系统配置参数
   */
  set sysOpts(value) {
    if (typeof(value) !== 'object') throw Error('The param value should be an Object.');

    this.private.sysOpts = value;
  }

  /**
   * 获取 天球系统配置参数
   * 
   * @return {Object} 天球系统配置参数
   */
  get sysOpts() {
    return this.private.sysOpts;
  }

  /**
   * 设置相交方向
   * 
   * @param {Boolean} value 相交方向
   */
  set direction(value) {
    this.private.direction = !! value;
  }

  /**
   * 获取相交方向
   * 
   * @return {Boolean} 相交方向
   */
  get direction() {
    return this.private.direction;
  }
}

module.exports = SystemCrossLocator;
