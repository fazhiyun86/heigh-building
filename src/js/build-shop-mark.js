/**
 * 地图地图标注页面
 */
(function(BUILD) {
	function GetQueryString(name) {
		var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
		var r = window.location.search.substr(1).match(reg);
		if(r != null) return unescape(r[2]);
		return null;
	}

	var mark = {};

	/*--------------获取地址中的参数---------start--------------------------------*/
	//	location.href = 'http://localhost/heig-building/build-mark.html?host=http://114.115.144.251:8001/&organi=111';

	//接口服务器地址
	var host = GetQueryString("host");
		// host = 'http://114.115.144.251:8001/';
	//组织机构
	var organi = GetQueryString("organi");
	/*--------------获取地址中的参数----------end--------------------------*/

	/**
	 * 页面接口
	 */
	var url = {
		area: host + 'WebApi/DataExchange/GetData/CMDS_District_List?dataKey=00-00-00-00',
		buildList: host + 'WebApi/DataExchange/GetData/Map_Chart_GetMarkMiddleAndSmallOrg?dataKey=00-00-00-00',
		latAndLon: host + 'WebApi/DataExchange/SendData/Map_Chart_OrgBindLatitudeAndLongitude?datakey=00-00-00-00'
	};
	/**
	 * 页面当中的请求
	 */
	var get = {
		//地区
		area: function(params, callback) {
			$.ajax({
				url: url.area,
				data: {
					ParentDistrictID: params
				},
				success: function(info) {
					info = info['DataSource']['Tables'][0]['Datas'];
					callback && callback(info);
				}
			})
		},
		//搜索
		buildList: function(params, callback) {
			$.ajax({
				url: url.buildList,
				data: params,
				success: function(info) {
					info = info['DataSource']['Tables'][0]['Datas'];
					callback && callback(info);
				}
			})
		},
		//提交
		latAndLon: function(params, callback) {
			$.ajax({
				type: 'post',
				url: url.latAndLon,
				contentType: 'application/json',
				data: JSON.stringify(params),
				success: function(info) {
					callback && callback(info);
				}
			});
		}
	};

	var templateHtml = {
		area: function(data, opt) {
			if(!data) return ''
			opt = opt || {}
			var name = opt.name || 'name',
				id = opt.id || 'id';

			var html = '';

			for(var i = 0; i < data.length; i++) {
				var item = data[i];

				html += '\
					<li class="building-tree-li" data-areaid="' + item['DistrictID'] + '" data-district="' + item['DistrictCode'] + '">\
						<i class="building-tree-icon building-icon-right" data-levelcode="'+ item['LevelCode'] +'"></i>\
						<p class="building-tree-title">' + item[name] + '</p>\
						<ul class="building-tree-ul"></ul>\
					</li>';
			}

			html += '';
			return html;
		},
		buildingList: function(data, opt) {
			if(!data) return '';
			var html = '';
			for(var i = 0; i < data.length; i++) {
				var item = data[i];
				
				var Latitude = item.Latitude;
				var Longitude = item.Longitude;
				
				if(Latitude && Longitude) {
					html += '\
					<tr>\
						<td class="building-search-name" data-buildid="' + item['OrganiseUnitID'] + '" datasrc="'+Latitude+'_'+Longitude+'">' + item['OrganiseUnitName'] + '</td>\
						<td style="text-align: center;">' + isMark(item) + '</td>\
					</tr>'
				} else {
					html += '\
					<tr>\
						<td class="building-search-name" data-buildid="' + item['OrganiseUnitID'] + '" datasrc="">' + item['OrganiseUnitName'] + '</td>\
						<td style="text-align: center;">' + isMark(item) + '</td>\
					</tr>'
				}
			}
			if(data.length === 0) {
				html += '<td class="building-center" colspan="3">暂无数据</td>';
			}

			function isMark(item) {
				var html = '';
				if(item.Latitude) {
					html += '<img src="src/images/builing-mark.png" alt="">'
				}
				return html;
			}
			$('.building-table tbody').html(html)
		}
	}

	mark.init = function() {
		this.setShowMarkTable()
		this.setAreaData()
		this.baiduMap()
	}
	var params_level_code = '';
	var SIZE = 8,
		INDEX = 0;
		
	var PageIndex = INDEX,
		PageSize = SIZE;

	//控制标注列表
	mark.setShowMarkTable = function() {

		var one = new BUILD.setSlider('#oneSlider')
		// console.log("one", one)
		$(".building-mark-wrap").on('click', function() {
			one.toggle(function() {
				// console.log("显示")
			}, function() {
				// console.log('隐藏')
			})
		})
	}
	// 区域请求数据的方法
	mark.setAreaData = function() {
		var $buildingTree = $('.building-tree-ul');

		var params = '00000000-0000-0000-0000-000000000000';

		get.area(params, function(info) {
			var html = templateHtml.area(info, {
				name: 'Districtname',
				id: 'DistrictID'
			})

			$buildingTree.html(html);
		})

		$buildingTree.on('click', '.building-tree-icon', function(e) {
			var $this = $(this);
			var $thisParent = $this.parent('li');
			params_level_code = $this.attr('data-levelcode');

			$('.building-tree-li').removeClass('active');
			$thisParent.addClass('active');

			var params = $thisParent.attr('data-areaid');
			var districtId = $thisParent.attr('data-district');
			var $wrap = $this.siblings('ul');

			if($this.data('first')) {
				if(!$this.data('nodata')) {
					$wrap.slideToggle('fast');
					$this.toggleClass('building-icon-right');
				}
			} else {
				$this.removeClass('building-icon-right').addClass('building-icon-loding');
				// 请求区域
				get.area(params, function(info) {
					var html = templateHtml.area(info, {
						name: 'Districtname',
						id: 'DistrictID'
					})
					if(info.length === 0) {
						$this.removeClass('building-icon-loding').data('nodata', true)
					} else {
						$this.removeClass('building-icon-loding').addClass('building-icon-bottom')
					}

					$wrap.html(html)
				})
				// 请求 建筑物的信息
				
				PageIndex = INDEX;
				PageSize = SIZE;
				get.buildList({
					DistrictLevel: params_level_code,
					OrganiseUnitName: '',
					PageIndex: PageIndex,
					PageSize: PageSize,
				}, function(info) {
					templateHtml.buildingList(info)
				})

				$this.data('first', true);
			}
			// 请求列表
		}).on('click', '.building-tree-li', function (e) {
			// 请求 建筑物的信息
			params_level_code = $(this).find('i').attr('data-levelcode');
			$('.building-tree-li').removeClass('active');
			$(this).addClass('active');
			
			PageIndex = INDEX;

			get.buildList({
				DistrictLevel: params_level_code,
				OrganiseUnitName: '',
				PageIndex: PageIndex,
				PageSize: PageSize,
			}, function(info) {
				templateHtml.buildingList(info)
			})
			e.stopPropagation();
		})

		// 点击查询的时候
		var buildingName = '', manageName = '';
		
		$('.building-search-btn').on('click', function() {
			buildingName = $("#buildingName").val();
			manageName = $("#manageName").val();

			PageIndex = INDEX;

			get.buildList({
				DistrictLevel: '',
				OrganiseUnitName: buildingName,
				PageIndex: PageIndex,
				PageSize: PageSize,
			}, function(info) {
				templateHtml.buildingList(info)
			})
		})
		// 翻页
		
		$('.building-table-footer').on('click', '.page-pre', function (e) {
			var $this = $(this);
			if ($this.hasClass('not-allow')) return false;

			--PageIndex;

			get.buildList({
				DistrictLevel: params_level_code,
				OrganiseUnitName: buildingName,
				PageIndex: PageIndex,
				PageSize: PageSize,
			}, function(info) {
				templateHtml.buildingList(info)
				if (PageIndex < 1) {
					PageIndex = INDEX;
					$this.addClass('not-allow');
				}
			})

		}).on('click', '.page-next', function (e) {
			++PageIndex;
			var $this = $(this);

			get.buildList({
				DistrictLevel: params_level_code,
				OrganiseUnitName: buildingName,
				PageIndex: PageIndex,
				PageSize: PageSize,
			}, function(info) {
				templateHtml.buildingList(info)

				if ($('.page-pre').hasClass('not-allow') && info.length != 0) {
					$('.page-pre').removeClass('not-allow');
				}
			})

		})
	}

	// 地图的
	mark.baiduMap = function() {
		var OrganiseUnitID, bldgName, nowPoint; //建筑物ID

		var map = new BMap.Map("container");
		var point = new BMap.Point(116.404, 39.915);
		map.centerAndZoom(point, 14);
		map.addControl(new BMap.NavigationControl());
		map.enableScrollWheelZoom();

		// 根据城市来定位
		var myCity = new BMap.LocalCity();
		myCity.get(function (result) {
			var cityName = result.name;
			map.setCenter(cityName);
		}); 

		map.addEventListener("click", function(e) {
			if($('.building-table').find('.active').length > 0) {
				setMarkerClick(e);
			}
		});

		
		function creatIco(Point) {
			if(!Point) {
				return false;
			}
			var point = new BMap.Point(Point.lat,Point.lng);

			// var vectorMarker = new BMap.Marker(new BMap.Point(Point.lat,Point.lng), {
			//   // 指定Marker的icon属性为Symbol
			//   icon: new BMap.Symbol(BMap_Symbol_SHAPE_POINT, {
			//     scale: 1,//图标缩放大小
			//     fillColor: "blue",//填充颜色
			//     fillOpacity: 0.5//填充透明度
			//   })
			// });
			// map.addOverlay(vectorMarker);
	
			var myIcon = new BMap.Icon("./src/images/icon_point.png", new BMap.Size(18, 26));
			var marker2 = new BMap.Marker(point, {icon: myIcon});
			map.addOverlay(marker2);
			
			map.centerAndZoom(point, 18);
		}

		function searchFn(searchVal,Point) {
			this.Point = Point;
			if(!searchVal) return false;
			
			map.clearOverlays();
			var local = new BMap.LocalSearch(map, {
				renderOptions: {
					map: map
				},
				onSearchComplete: function(results) {
					// 搜索结果
					// console.log("results", results);
//					if(results.wr == '[]' || results.wr == '') {
//						map.clearOverlays();
//					}
				},
			});
			local.disableFirstResultSelection();

			local.search(searchVal);
			local.setMarkersSetCallback(function(pois) {
				for(var i = 0; i < pois.length; i++) {

					var item = pois[i];
					var longitudeValue = item.point.lng; // 经度值
					var latitudeValue = item.point.lat; // 纬度值
					var marker = item.marker; // marker 
					var txt = pois[i].address;

					marker.addEventListener("click", function() {
						//屏蔽点击标记时提示重新设置标记
						event.stopPropagation();
					});
				}
				creatIco(Point);
			})
		}

		function setMarkerClick(info) {
			nowPoint = info.point;

			var $promptWrap = $('.building-prompt');
			$promptWrap.find('.building-prompt-main-txt').text('将此位置点保存为' + bldgName + '地图位置？');
			$promptWrap.removeClass('building-hide');
		}

		//-----------
		$('.building-table').on('click', '.building-search-name', function(e) {
			$('.building-table').find('.active').removeClass('active');
			var $this = $(this);
			$this.addClass('active');
			
			var searchVal = $this.text();
			
			bldgName = searchVal;
			OrganiseUnitID = $this.attr('data-buildid');

			
			var zb = $this.attr('datasrc');
			if(zb){
				var zbArr = zb.split('_');
				var Point = {
					'lng':zbArr[0],
					'lat':zbArr[1]
				}
			} else {
				Point = '';
			}
			searchFn(searchVal,Point);
		})

		// 
		$('.building-prompt').on('click', '.building-prompt-cancle', function(e) {
			$('.building-prompt').addClass('building-hide');
		}).on('click', '.building-prompt-sure', function(e) {
			var params = {
				OrganiseUnitID: OrganiseUnitID,
				Longitude: nowPoint.lng,
				Latitude: nowPoint.lat,
				ModifiedBy: ''
			}

			get.latAndLon(params, function(info) {
				BUILD.alert(info.Summary.Message);

				$('.building-prompt').addClass('building-hide');

				get.buildList({
					DistrictLevel: params_level_code,
					OrganiseUnitName: '',
					PageIndex: PageIndex,
					PageSize: PageSize,
				}, function(info) {
					templateHtml.buildingList(info);
					
					$('[data-buildid=' + OrganiseUnitID +']').click();
				})
			})
		})

		//判断浏览区是否支持canvas
		function isSupportCanvas() {
			var elem = document.createElement('canvas');
			return !!(elem.getContext && elem.getContext('2d'));
		}
	}

	mark.init();
})(BUILD)